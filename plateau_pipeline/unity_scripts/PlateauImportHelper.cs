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

        // CityGML data path (update if different on your machine)
        private static string citygmlPath = "";

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

        [MenuItem("PLATEAU Pipeline/2. Audit Imported Meshes")]
        public static void AuditImportedMeshes()
        {
            var meshFilters = FindObjectsByType<MeshFilter>(FindObjectsSortMode.None);
            int totalVerts = 0;
            int totalTris = 0;
            int meshCount = 0;
            var materialSet = new HashSet<string>();

            foreach (var mf in meshFilters)
            {
                if (mf.sharedMesh == null) continue;
                meshCount++;
                totalVerts += mf.sharedMesh.vertexCount;
                totalTris += mf.sharedMesh.triangles.Length / 3;

                var renderer = mf.GetComponent<MeshRenderer>();
                if (renderer != null && renderer.sharedMaterials != null)
                {
                    foreach (var mat in renderer.sharedMaterials)
                    {
                        if (mat != null) materialSet.Add(mat.name);
                    }
                }
            }

            Debug.Log("=== Mesh Audit ===");
            Debug.Log($"Total meshes: {meshCount}");
            Debug.Log($"Total vertices: {totalVerts:N0}");
            Debug.Log($"Total triangles: {totalTris:N0}");
            Debug.Log($"Unique materials: {materialSet.Count}");
            Debug.Log($"Avg tris/mesh: {(meshCount > 0 ? totalTris / meshCount : 0):N0}");

            if (totalTris > 0)
            {
                Debug.Log("");
                Debug.Log("=== Per-Object Breakdown (top 20 by tri count) ===");
                var sorted = new List<(string name, int tris)>();
                foreach (var mf in meshFilters)
                {
                    if (mf.sharedMesh == null) continue;
                    sorted.Add((mf.gameObject.name, mf.sharedMesh.triangles.Length / 3));
                }
                sorted.Sort((a, b) => b.tris.CompareTo(a.tris));

                for (int i = 0; i < Mathf.Min(20, sorted.Count); i++)
                {
                    Debug.Log($"  {sorted[i].name}: {sorted[i].tris:N0} tris");
                }
            }
        }

        [MenuItem("PLATEAU Pipeline/3. List Materials for Atlas Planning")]
        public static void ListMaterials()
        {
            var renderers = FindObjectsByType<MeshRenderer>(FindObjectsSortMode.None);
            var matToObjects = new Dictionary<string, List<string>>();
            var matToTextures = new Dictionary<string, List<string>>();

            foreach (var r in renderers)
            {
                if (r.sharedMaterials == null) continue;
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
                        // Check common texture properties
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

            Debug.Log($"=== Material Catalog ({matToObjects.Count} unique materials) ===");
            foreach (var kvp in matToObjects)
            {
                string texInfo = matToTextures.ContainsKey(kvp.Key) && matToTextures[kvp.Key].Count > 0
                    ? string.Join(", ", matToTextures[kvp.Key])
                    : "no textures";
                Debug.Log($"  {kvp.Key} [{kvp.Value.Count} objects] -> {texInfo}");
            }
        }

        [MenuItem("PLATEAU Pipeline/4. Check Roblox Tri Budget")]
        public static void CheckTriBudget()
        {
            const int ROBLOX_TRI_LIMIT = 20000;
            var meshFilters = FindObjectsByType<MeshFilter>(FindObjectsSortMode.None);
            int overBudget = 0;

            Debug.Log("=== Roblox Triangle Budget Check (20k per mesh) ===");
            foreach (var mf in meshFilters)
            {
                if (mf.sharedMesh == null) continue;
                int tris = mf.sharedMesh.triangles.Length / 3;
                if (tris > ROBLOX_TRI_LIMIT)
                {
                    overBudget++;
                    float ratio = (float)ROBLOX_TRI_LIMIT / tris;
                    Debug.LogWarning($"  OVER: {mf.gameObject.name} = {tris:N0} tris (need {ratio:P0} decimation)");
                }
            }

            if (overBudget == 0)
                Debug.Log("All meshes are within the 20k triangle budget!");
            else
                Debug.LogWarning($"{overBudget} meshes exceed the 20k triangle budget.");
        }
    }
}
#endif
