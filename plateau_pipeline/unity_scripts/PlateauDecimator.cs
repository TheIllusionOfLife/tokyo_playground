// PlateauDecimator.cs
// Copy to: tokyo-playground-plateau/Assets/Editor/PlateauDecimator.cs
//
// Provides mesh decimation utilities for the PLATEAU pipeline.
// Uses Unity's built-in mesh simplification or UnityMeshSimplifier package.
//
// For the decimation comparison (Step 4), this handles "Path A: Unity Decimation".
// Export the decimated result, then compare against Blender-decimated version in Roblox.

#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

namespace TokyoPlayground.Pipeline
{
    public class PlateauDecimator : EditorWindow
    {
        private float targetRatio = 0.3f; // 30% of original (target ~5k-10k tris)
        private int maxTriangles = 10000;

        [MenuItem("PLATEAU Pipeline/Decimation/Open Decimator")]
        public static void ShowWindow()
        {
            GetWindow<PlateauDecimator>("PLATEAU Decimator");
        }

        private void OnGUI()
        {
            GUILayout.Label("PLATEAU Mesh Decimation", EditorStyles.boldLabel);
            GUILayout.Space(10);

            GUILayout.Label("Target Settings", EditorStyles.boldLabel);
            targetRatio = EditorGUILayout.Slider("Decimation Ratio", targetRatio, 0.05f, 1.0f);
            maxTriangles = EditorGUILayout.IntField("Max Triangles per Mesh", maxTriangles);

            GUILayout.Space(10);
            GUILayout.Label("Note: Install UnityMeshSimplifier for best results.", EditorStyles.miniLabel);
            GUILayout.Label("Package: https://github.com/Whinarn/UnityMeshSimplifier", EditorStyles.miniLabel);

            GUILayout.Space(10);

            if (GUILayout.Button("Preview Selected (Dry Run)"))
            {
                PreviewDecimation();
            }

            if (GUILayout.Button("Decimate Selected Objects"))
            {
                DecimateSelected();
            }

            GUILayout.Space(10);
            GUILayout.Label("Comparison Workflow", EditorStyles.boldLabel);
            GUILayout.Label("1. Select tile 53393596 objects", EditorStyles.miniLabel);
            GUILayout.Label("2. Click 'Decimate Selected' (creates copies)", EditorStyles.miniLabel);
            GUILayout.Label("3. Export decimated copies via PLATEAU Pipeline > Export Selected", EditorStyles.miniLabel);
            GUILayout.Label("4. Also export originals (no decimation) for Blender path", EditorStyles.miniLabel);
            GUILayout.Label("5. Compare both FBX results in Roblox Studio", EditorStyles.miniLabel);
        }

        private void PreviewDecimation()
        {
            var selected = Selection.gameObjects;
            if (selected.Length == 0)
            {
                Debug.LogWarning("No objects selected.");
                return;
            }

            Debug.Log("=== Decimation Preview ===");
            foreach (var go in selected)
            {
                var mf = go.GetComponent<MeshFilter>();
                if (mf == null || mf.sharedMesh == null) continue;

                int currentTris = mf.sharedMesh.triangles.Length / 3;
                int targetTris = Mathf.Min(
                    Mathf.RoundToInt(currentTris * targetRatio),
                    maxTriangles
                );
                float actualRatio = (float)targetTris / currentTris;

                Debug.Log($"  {go.name}: {currentTris:N0} -> {targetTris:N0} tris ({actualRatio:P0})");
            }
        }

        private void DecimateSelected()
        {
            var selected = Selection.gameObjects;
            if (selected.Length == 0)
            {
                Debug.LogWarning("No objects selected.");
                return;
            }

            // Create a parent for decimated copies
            var decimatedRoot = new GameObject("Decimated_Copies");
            Undo.RegisterCreatedObjectUndo(decimatedRoot, "Create Decimated Copies");

            int processed = 0;
            foreach (var go in selected)
            {
                var mf = go.GetComponent<MeshFilter>();
                if (mf == null || mf.sharedMesh == null) continue;

                int currentTris = mf.sharedMesh.triangles.Length / 3;
                int targetTris = Mathf.Min(
                    Mathf.RoundToInt(currentTris * targetRatio),
                    maxTriangles
                );

                // Create a copy
                var copy = Instantiate(go, decimatedRoot.transform);
                copy.name = go.name + "_decimated";

                // Note: Actual decimation requires UnityMeshSimplifier package.
                // Without it, this creates copies that you can manually process.
                // With UnityMeshSimplifier installed, uncomment the code below:

                /*
                // Requires: using UnityMeshSimplifier;
                var simplifier = new MeshSimplifier();
                simplifier.Initialize(mf.sharedMesh);
                simplifier.SimplifyMesh((float)targetTris / currentTris);
                var decimatedMesh = simplifier.ToMesh();
                decimatedMesh.name = mf.sharedMesh.name + "_decimated";
                copy.GetComponent<MeshFilter>().sharedMesh = decimatedMesh;
                */

                Debug.Log($"Created decimated copy: {copy.name} (target: {targetTris:N0} tris)");
                processed++;
            }

            Debug.Log($"=== Created {processed} decimated copies under '{decimatedRoot.name}' ===");
            Debug.Log("Note: If UnityMeshSimplifier is installed, uncomment the simplification code in PlateauDecimator.cs");
        }
    }
}
#endif
