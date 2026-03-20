// PlateauExporter.cs
// Copy to: tokyo-playground-plateau/Assets/Editor/PlateauExporter.cs
//
// Exports PLATEAU-imported meshes as FBX files organized by tile and feature type.
// Requires the Unity FBX Exporter package (com.unity.formats.fbx).

#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEditor.Formats.Fbx.Exporter;
using System.IO;
using System.Collections.Generic;

namespace TokyoPlayground.Pipeline
{
    public class PlateauExporter : EditorWindow
    {
        private static readonly string ExportRoot = "Assets/plateau_export";

        [MenuItem("PLATEAU Pipeline/5. Export All as FBX")]
        public static void ExportAll()
        {
            // Create export directory structure
            string absRoot = Path.Combine(Application.dataPath, "plateau_export");
            string[] subdirs = { "bldg", "ubld", "tran", "dem", "brid" };
            foreach (var sub in subdirs)
            {
                Directory.CreateDirectory(Path.Combine(absRoot, sub));
            }

            // Find all PLATEAU-imported root objects
            // PLATEAU SDK typically creates objects under a "PLATEAU" root or named by tile
            var roots = new List<GameObject>();
            foreach (var go in FindObjectsByType<Transform>(FindObjectsSortMode.None))
            {
                if (go.parent == null || go.parent == go.transform)
                {
                    // Check if this looks like a PLATEAU import
                    string name = go.gameObject.name.ToLower();
                    if (name.Contains("bldg") || name.Contains("tran") ||
                        name.Contains("ubld") || name.Contains("dem") ||
                        name.Contains("brid") || name.Contains("5339"))
                    {
                        roots.Add(go.gameObject);
                    }
                }
            }

            if (roots.Count == 0)
            {
                Debug.LogWarning("No PLATEAU objects found. Make sure PLATEAU data is imported.");
                Debug.Log("Looking for objects containing: bldg, tran, ubld, dem, brid, or 5339* in name.");
                return;
            }

            int exported = 0;
            foreach (var root in roots)
            {
                string category = CategorizeObject(root.name);
                string exportPath = $"{ExportRoot}/{category}/{root.name}.fbx";

                // Export with settings optimized for Roblox import
                var settings = new ExportModelSettingsSerialize();

                try
                {
                    ModelExporter.ExportObject(exportPath, root);
                    exported++;
                    Debug.Log($"Exported: {exportPath}");
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"Failed to export {root.name}: {e.Message}");
                }
            }

            Debug.Log($"=== Export Complete: {exported} FBX files ===");
            Debug.Log($"Output: {absRoot}");
            AssetDatabase.Refresh();
        }

        [MenuItem("PLATEAU Pipeline/6. Export Selected as FBX")]
        public static void ExportSelected()
        {
            var selected = Selection.gameObjects;
            if (selected.Length == 0)
            {
                Debug.LogWarning("No objects selected. Select PLATEAU objects in the Hierarchy.");
                return;
            }

            string absRoot = Path.Combine(Application.dataPath, "plateau_export");
            string[] subdirs = { "bldg", "ubld", "tran", "dem", "brid" };
            foreach (var sub in subdirs)
            {
                Directory.CreateDirectory(Path.Combine(absRoot, sub));
            }

            foreach (var go in selected)
            {
                string category = CategorizeObject(go.name);
                string exportPath = $"{ExportRoot}/{category}/{go.name}.fbx";

                try
                {
                    ModelExporter.ExportObject(exportPath, go);
                    Debug.Log($"Exported: {exportPath}");
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"Failed to export {go.name}: {e.Message}");
                }
            }

            AssetDatabase.Refresh();
        }

        private static string CategorizeObject(string name)
        {
            string lower = name.ToLower();
            if (lower.Contains("ubld")) return "ubld";
            if (lower.Contains("bldg")) return "bldg";
            if (lower.Contains("tran")) return "tran";
            if (lower.Contains("dem")) return "dem";
            if (lower.Contains("brid")) return "brid";
            return "bldg"; // default
        }
    }
}
#endif
