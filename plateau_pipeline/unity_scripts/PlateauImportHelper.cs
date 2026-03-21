// PlateauImportHelper.cs
// Copy to: tokyo-playground-plateau/Assets/Editor/PlateauImportHelper.cs
//
// Provides menu items for PLATEAU SDK import configuration.
// After installing PLATEAU SDK for Unity, this script adds a
// "PLATEAU Pipeline" menu with helpers for the import workflow.

#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using System.IO;
using System.Collections.Generic;
using System.Linq;

namespace TokyoPlayground.Pipeline
{
    public class PlateauImportHelper : EditorWindow
    {
        // The 4 core LOD2 tiles for the Shibuya playable area
        public static readonly string[] CoreTiles = {
            "53393585", // SW of station
            "53393586", // SE of station
            "53393595", // NW of station (Scramble area)
            "53393596", // NE of station (current prototype)
        };

        // Reference point: Shibuya Station
        public const double RefLat = 35.6580;
        public const double RefLon = 139.7016;

        // Feature types we want for Roblox export
        private static readonly string[] ExportFeatures = { "bldg", "ubld", "tran", "dem", "brid" };

        // Feature types to skip (analytical overlays, not game geometry)
        private static readonly string[] SkipFeatures = { "fld", "lsld", "luse", "urf", "veg", "frn" };

        [MenuItem("PLATEAU Pipeline/1. Log Import Checklist")]
        public static void LogImportChecklist()
        {
            Debug.Log("=== PLATEAU Import Checklist ===");
            Debug.Log("1. Open PLATEAU SDK > Import CityGML");
            Debug.Log("2. Source: Local");
            Debug.Log($"3. Path: <your CityGML root>/13113_shibuya-ku_pref_2023_citygml_2_op/");
            Debug.Log($"4. Reference Point: lat={RefLat}, lon={RefLon} (Shibuya Station)");
            Debug.Log("");
            Debug.Log("=== Import Settings ===");
            Debug.Log("Feature: bldg | LOD: 2 | Granularity: Area (~250m) | Tiles: ALL 4 core");
            Debug.Log("Feature: ubld | LOD: 2 | Granularity: Area | Tiles: 53393596 only");
            Debug.Log("Feature: tran | LOD: 2 | Granularity: Merged per tile | Tiles: ALL 4 core");
            Debug.Log("Feature: dem  | LOD: -  | Granularity: Per tile | Tiles: matching");
            Debug.Log("Feature: brid | LOD: 2 | Granularity: Per bridge | Tiles: ALL 4 core");
            Debug.Log("");
            Debug.Log($"Core tiles: {string.Join(", ", CoreTiles)}");
        }

        /// <summary>
        /// Walks up the hierarchy to find the LOD level (LOD0, LOD1, LOD2, etc.)
        /// and feature type (bldg, tran, ubld, dem, brid, fld, etc.) for a given transform.
        /// </summary>
        private static (string lodLevel, string featureType) ClassifyMesh(Transform t)
        {
            string lodLevel = "unknown";
            string featureType = "unknown";

            Transform current = t;
            while (current != null)
            {
                string name = current.name;

                // Check for LOD level in ancestor names
                if (lodLevel == "unknown")
                {
                    if (name.StartsWith("LOD") && name.Length >= 4)
                    {
                        lodLevel = name; // e.g. "LOD0", "LOD1", "LOD2"
                    }
                }

                // Check for feature type in ancestor names
                if (featureType == "unknown")
                {
                    string lower = name.ToLower();
                    foreach (var feat in ExportFeatures)
                    {
                        if (lower.Contains(feat))
                        {
                            featureType = feat;
                            break;
                        }
                    }
                    if (featureType == "unknown")
                    {
                        foreach (var feat in SkipFeatures)
                        {
                            if (lower.Contains(feat))
                            {
                                featureType = feat;
                                break;
                            }
                        }
                    }
                }

                if (lodLevel != "unknown" && featureType != "unknown")
                    break;

                current = current.parent;
            }

            return (lodLevel, featureType);
        }

        [MenuItem("PLATEAU Pipeline/2. Audit Imported Meshes (All)")]
        public static void AuditAllMeshes()
        {
            AuditMeshes(filterLod: null);
        }

        [MenuItem("PLATEAU Pipeline/2b. Audit LOD2 Only")]
        public static void AuditLOD2Only()
        {
            AuditMeshes(filterLod: "LOD2");
        }

        [MenuItem("PLATEAU Pipeline/2c. Audit by LOD + Feature Breakdown")]
        public static void AuditBreakdown()
        {
            var meshFilters = FindObjectsByType<MeshFilter>(FindObjectsSortMode.None);

            // Group by (LOD, feature)
            var groups = new Dictionary<string, (int meshes, int verts, int tris)>();

            foreach (var mf in meshFilters)
            {
                if (mf.sharedMesh == null) continue;

                var (lod, feature) = ClassifyMesh(mf.transform);
                string key = $"{lod}/{feature}";

                if (!groups.ContainsKey(key))
                    groups[key] = (0, 0, 0);

                var g = groups[key];
                groups[key] = (
                    g.meshes + 1,
                    g.verts + mf.sharedMesh.vertexCount,
                    g.tris + mf.sharedMesh.triangles.Length / 3
                );
            }

            Debug.Log("=== Mesh Breakdown by LOD + Feature ===");
            Debug.Log($"{"Group",-25} {"Meshes",8} {"Vertices",12} {"Triangles",12}");
            Debug.Log(new string('-', 60));

            foreach (var kvp in groups.OrderBy(x => x.Key))
            {
                var g = kvp.Value;
                Debug.Log($"  {kvp.Key,-23} {g.meshes,8:N0} {g.verts,12:N0} {g.tris,12:N0}");
            }

            Debug.Log(new string('-', 60));

            // Summary: what we want (LOD2 export features) vs what to skip
            int exportTris = 0, exportMeshes = 0;
            int skipTris = 0, skipMeshes = 0;
            foreach (var kvp in groups)
            {
                bool isLod2 = kvp.Key.Contains("LOD2");
                bool isExportFeature = ExportFeatures.Any(f => kvp.Key.Contains(f));
                bool isSkipFeature = SkipFeatures.Any(f => kvp.Key.Contains(f));

                if (isLod2 && isExportFeature)
                {
                    exportTris += kvp.Value.tris;
                    exportMeshes += kvp.Value.meshes;
                }
                else
                {
                    skipTris += kvp.Value.tris;
                    skipMeshes += kvp.Value.meshes;
                }
            }

            // Also count non-LOD meshes (dem, etc. that may not have LOD grouping)
            foreach (var kvp in groups)
            {
                bool hasLod = kvp.Key.Contains("LOD");
                bool isExportFeature = ExportFeatures.Any(f => kvp.Key.Contains(f));
                if (!hasLod && isExportFeature)
                {
                    exportTris += kvp.Value.tris;
                    exportMeshes += kvp.Value.meshes;
                }
            }

            Debug.Log("");
            Debug.Log($"For Roblox export (LOD2 + export features): {exportMeshes:N0} meshes, {exportTris:N0} tris");
            Debug.Log($"Can skip/delete: {skipMeshes:N0} meshes, {skipTris:N0} tris");
        }

        private static void AuditMeshes(string filterLod)
        {
            var meshFilters = FindObjectsByType<MeshFilter>(FindObjectsSortMode.None);
            int totalVerts = 0;
            int totalTris = 0;
            int meshCount = 0;
            int skippedByLod = 0;
            var materialSet = new HashSet<string>();
            var featureCounts = new Dictionary<string, (int meshes, int tris)>();

            foreach (var mf in meshFilters)
            {
                if (mf.sharedMesh == null) continue;

                var (lod, feature) = ClassifyMesh(mf.transform);

                // Apply LOD filter if specified
                if (filterLod != null && lod != filterLod)
                {
                    // Allow meshes with no LOD grouping (dem, etc.)
                    if (lod != "unknown")
                    {
                        skippedByLod++;
                        continue;
                    }
                }

                int tris = mf.sharedMesh.triangles.Length / 3;
                meshCount++;
                totalVerts += mf.sharedMesh.vertexCount;
                totalTris += tris;

                if (!featureCounts.ContainsKey(feature))
                    featureCounts[feature] = (0, 0);
                var fc = featureCounts[feature];
                featureCounts[feature] = (fc.meshes + 1, fc.tris + tris);

                var renderer = mf.GetComponent<MeshRenderer>();
                if (renderer != null && renderer.sharedMaterials != null)
                {
                    foreach (var mat in renderer.sharedMaterials)
                    {
                        if (mat != null) materialSet.Add(mat.name);
                    }
                }
            }

            string label = filterLod != null ? $"Mesh Audit ({filterLod} only)" : "Mesh Audit (All)";
            Debug.Log($"=== {label} ===");
            if (skippedByLod > 0)
                Debug.Log($"Skipped {skippedByLod:N0} meshes (other LOD levels)");
            Debug.Log($"Total meshes: {meshCount:N0}");
            Debug.Log($"Total vertices: {totalVerts:N0}");
            Debug.Log($"Total triangles: {totalTris:N0}");
            Debug.Log($"Unique materials: {materialSet.Count}");
            Debug.Log($"Avg tris/mesh: {(meshCount > 0 ? totalTris / meshCount : 0):N0}");

            // Per-feature breakdown
            Debug.Log("");
            Debug.Log("=== By Feature Type ===");
            foreach (var kvp in featureCounts.OrderByDescending(x => x.Value.tris))
            {
                bool skip = SkipFeatures.Contains(kvp.Key);
                string tag = skip ? " [SKIP - not game geometry]" : "";
                Debug.Log($"  {kvp.Key}: {kvp.Value.meshes:N0} meshes, {kvp.Value.tris:N0} tris{tag}");
            }

            // Top 20 by tri count
            if (totalTris > 0)
            {
                Debug.Log("");
                Debug.Log("=== Top 20 Meshes by Tri Count ===");
                var sorted = new List<(string name, string feature, string lod, int tris)>();
                foreach (var mf in meshFilters)
                {
                    if (mf.sharedMesh == null) continue;
                    var (lod, feature) = ClassifyMesh(mf.transform);
                    if (filterLod != null && lod != filterLod && lod != "unknown") continue;

                    sorted.Add((mf.gameObject.name, feature, lod, mf.sharedMesh.triangles.Length / 3));
                }
                sorted.Sort((a, b) => b.tris.CompareTo(a.tris));

                for (int i = 0; i < Mathf.Min(20, sorted.Count); i++)
                {
                    Debug.Log($"  {sorted[i].name} [{sorted[i].feature}/{sorted[i].lod}]: {sorted[i].tris:N0} tris");
                }
            }
        }

        [MenuItem("PLATEAU Pipeline/3. List Materials for Atlas Planning")]
        public static void ListMaterials()
        {
            ListMaterialsFiltered(lodFilter: "LOD2");
        }

        [MenuItem("PLATEAU Pipeline/3b. List All Materials")]
        public static void ListAllMaterials()
        {
            ListMaterialsFiltered(lodFilter: null);
        }

        private static void ListMaterialsFiltered(string lodFilter)
        {
            var renderers = FindObjectsByType<MeshRenderer>(FindObjectsSortMode.None);
            var matToObjects = new Dictionary<string, List<string>>();
            var matToTextures = new Dictionary<string, List<string>>();

            foreach (var r in renderers)
            {
                if (r.sharedMaterials == null) continue;

                // Apply LOD filter
                if (lodFilter != null)
                {
                    var (lod, _) = ClassifyMesh(r.transform);
                    if (lod != lodFilter && lod != "unknown") continue;
                }

                foreach (var mat in r.sharedMaterials)
                {
                    if (mat == null) continue;
                    string matName = mat.name;

                    if (!matToObjects.ContainsKey(matName))
                        matToObjects[matName] = new List<string>();
                    matToObjects[matName].Add(r.gameObject.name);

                    if (!matToTextures.ContainsKey(matName))
                    {
                        matToTextures[matName] = new List<string>();
                        string[] texProps = { "_MainTex", "_BaseMap", "_BumpMap", "_MetallicGlossMap" };
                        foreach (var prop in texProps)
                        {
                            if (mat.HasProperty(prop))
                            {
                                var tex = mat.GetTexture(prop);
                                if (tex != null)
                                    matToTextures[matName].Add($"{prop}={tex.name} ({tex.width}x{tex.height})");
                            }
                        }
                    }
                }
            }

            string label = lodFilter != null ? $"Material Catalog ({lodFilter} only)" : "Material Catalog (All)";
            Debug.Log($"=== {label}: {matToObjects.Count} unique materials ===");
            foreach (var kvp in matToObjects.OrderByDescending(x => x.Value.Count))
            {
                string texInfo = matToTextures.ContainsKey(kvp.Key) && matToTextures[kvp.Key].Count > 0
                    ? string.Join(", ", matToTextures[kvp.Key])
                    : "no textures";
                Debug.Log($"  {kvp.Key} [{kvp.Value.Count} objects] -> {texInfo}");
            }
        }

        [MenuItem("PLATEAU Pipeline/4. Check Roblox Tri Budget (LOD2)")]
        public static void CheckTriBudgetLOD2()
        {
            CheckTriBudgetFiltered("LOD2");
        }

        [MenuItem("PLATEAU Pipeline/4b. Check Roblox Tri Budget (All)")]
        public static void CheckTriBudgetAll()
        {
            CheckTriBudgetFiltered(null);
        }

        private static void CheckTriBudgetFiltered(string lodFilter)
        {
            const int ROBLOX_TRI_LIMIT = 20000;
            var meshFilters = FindObjectsByType<MeshFilter>(FindObjectsSortMode.None);
            int overBudget = 0;
            int totalChecked = 0;

            string label = lodFilter != null ? $"Roblox Budget ({lodFilter})" : "Roblox Budget (All)";
            Debug.Log($"=== {label} - {ROBLOX_TRI_LIMIT:N0} tri limit ===");

            foreach (var mf in meshFilters)
            {
                if (mf.sharedMesh == null) continue;

                var (lod, feature) = ClassifyMesh(mf.transform);

                // Apply LOD filter
                if (lodFilter != null && lod != lodFilter && lod != "unknown") continue;

                // Skip non-export features
                if (SkipFeatures.Contains(feature)) continue;

                totalChecked++;
                int tris = mf.sharedMesh.triangles.Length / 3;
                if (tris > ROBLOX_TRI_LIMIT)
                {
                    overBudget++;
                    float ratio = (float)ROBLOX_TRI_LIMIT / tris;
                    Debug.LogWarning($"  OVER: {mf.gameObject.name} [{feature}/{lod}] = {tris:N0} tris (need {ratio:P0} decimation)");
                }
            }

            Debug.Log($"Checked {totalChecked:N0} meshes (export features only, skipped: {string.Join(", ", SkipFeatures)})");
            if (overBudget == 0)
                Debug.Log("All meshes are within the 20k triangle budget!");
            else
                Debug.LogWarning($"{overBudget} meshes exceed the 20k triangle budget.");
        }
    }
}
#endif
