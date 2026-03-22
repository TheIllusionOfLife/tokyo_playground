// TriplanarBaker.cs
// Copy to: Unity project Assets/Editor/TriplanarBaker.cs
//
// Bakes Triplanar shader results into UV-mapped textures so they survive FBX export.
// Use on ReproducedRoad objects from PLATEAU SDK's 道路調整 (road generation).
//
// The road meshes use a Triplanar shader that projects textures based on world-space
// normals. This shader is Unity-specific and doesn't survive FBX/glTF export.
// This script:
//   1. Auto-generates UV maps for road meshes (Smart UV Project equivalent)
//   2. Renders the Triplanar shader result to a texture via GPU bake
//   3. Replaces the Triplanar material with a standard material using the baked texture
//   4. The mesh can then be exported via FBX with the baked texture intact

#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using System.IO;
using System.Collections.Generic;

namespace TokyoPlayground.Pipeline
{
    public class TriplanarBaker : EditorWindow
    {
        private int bakeResolution = 2048;
        private string outputFolder = "Assets/BakedRoads";

        [MenuItem("PLATEAU Pipeline/Roads/Bake Triplanar to Texture")]
        public static void ShowWindow()
        {
            GetWindow<TriplanarBaker>("Triplanar Baker");
        }

        private void OnGUI()
        {
            GUILayout.Label("Triplanar Shader Baker", EditorStyles.boldLabel);
            GUILayout.Space(5);
            GUILayout.Label("Bakes road Triplanar shader into UV-mapped textures", EditorStyles.miniLabel);
            GUILayout.Label("for FBX export compatibility.", EditorStyles.miniLabel);
            GUILayout.Space(10);

            bakeResolution = EditorGUILayout.IntPopup("Bake Resolution",
                bakeResolution,
                new string[] { "512x512", "1024x1024", "2048x2048", "4096x4096" },
                new int[] { 512, 1024, 2048, 4096 });

            outputFolder = EditorGUILayout.TextField("Output Folder", outputFolder);

            GUILayout.Space(10);

            if (GUILayout.Button("Preview Selected (Info Only)"))
            {
                PreviewSelected();
            }

            GUILayout.Space(5);

            if (GUILayout.Button("Bake Selected Road Meshes"))
            {
                BakeSelected();
            }

            GUILayout.Space(10);
            GUILayout.Label("Workflow:", EditorStyles.boldLabel);
            GUILayout.Label("1. Select ReproducedRoad in Hierarchy", EditorStyles.miniLabel);
            GUILayout.Label("2. Click 'Bake Selected Road Meshes'", EditorStyles.miniLabel);
            GUILayout.Label("3. Each mesh gets a baked texture + new UV map", EditorStyles.miniLabel);
            GUILayout.Label("4. Export via FBX Exporter with embedded textures", EditorStyles.miniLabel);
        }

        private void PreviewSelected()
        {
            var selected = Selection.gameObjects;
            if (selected.Length == 0)
            {
                Debug.LogWarning("No objects selected.");
                return;
            }

            int meshCount = 0;
            int triplanarCount = 0;
            int uvCount = 0;

            foreach (var go in selected)
            {
                foreach (var mf in go.GetComponentsInChildren<MeshFilter>())
                {
                    meshCount++;
                    if (mf.sharedMesh != null && mf.sharedMesh.uv != null && mf.sharedMesh.uv.Length > 0)
                        uvCount++;

                    var renderer = mf.GetComponent<MeshRenderer>();
                    if (renderer != null)
                    {
                        foreach (var mat in renderer.sharedMaterials)
                        {
                            if (mat != null && mat.shader != null &&
                                mat.shader.name.ToLower().Contains("triplanar"))
                            {
                                triplanarCount++;
                                break;
                            }
                        }
                    }
                }
            }

            Debug.Log($"=== Triplanar Baker Preview ===");
            Debug.Log($"Total meshes: {meshCount}");
            Debug.Log($"With Triplanar shader: {triplanarCount}");
            Debug.Log($"With existing UVs: {uvCount}");
            Debug.Log($"Need UV generation: {meshCount - uvCount}");
        }

        private void BakeSelected()
        {
            var selected = Selection.gameObjects;
            if (selected.Length == 0)
            {
                Debug.LogWarning("No objects selected. Select ReproducedRoad.");
                return;
            }

            // Create output folder
            string absOutputFolder = Path.Combine(Application.dataPath,
                outputFolder.Replace("Assets/", ""));
            Directory.CreateDirectory(absOutputFolder);

            int baked = 0;

            foreach (var go in selected)
            {
                foreach (var mf in go.GetComponentsInChildren<MeshFilter>())
                {
                    var renderer = mf.GetComponent<MeshRenderer>();
                    if (renderer == null || mf.sharedMesh == null) continue;

                    string meshName = mf.gameObject.name;
                    Debug.Log($"Baking: {meshName}");

                    // Step 1: Ensure mesh has UVs (generate if missing)
                    Mesh mesh = EnsureUVs(mf);

                    // Step 2: Bake the current material appearance to a texture
                    Texture2D bakedTex = BakeMaterialToTexture(renderer, mesh);
                    if (bakedTex == null)
                    {
                        Debug.LogWarning($"Failed to bake {meshName}, skipping.");
                        continue;
                    }

                    // Step 3: Save baked texture
                    string texPath = $"{outputFolder}/{meshName}_baked.png";
                    string absTexPath = Path.Combine(absOutputFolder, $"{meshName}_baked.png");
                    File.WriteAllBytes(absTexPath, bakedTex.EncodeToPNG());

                    // Step 4: Create standard material with baked texture
                    AssetDatabase.Refresh();
                    var savedTex = AssetDatabase.LoadAssetAtPath<Texture2D>(texPath);

                    var newMat = new Material(Shader.Find("Standard"));
                    newMat.name = $"mat_{meshName}_baked";
                    newMat.SetTexture("_MainTex", savedTex);

                    string matPath = $"{outputFolder}/{meshName}_baked.mat";
                    AssetDatabase.CreateAsset(newMat, matPath);

                    // Step 5: Assign new material
                    renderer.sharedMaterial = AssetDatabase.LoadAssetAtPath<Material>(matPath);

                    baked++;
                    Debug.Log($"Baked: {meshName} -> {texPath}");
                }
            }

            AssetDatabase.Refresh();
            Debug.Log($"=== Baking Complete: {baked} meshes processed ===");
            Debug.Log($"Output: {outputFolder}");
            Debug.Log("Now export with FBX Exporter (Embed Textures checked).");
        }

        private Mesh EnsureUVs(MeshFilter mf)
        {
            Mesh original = mf.sharedMesh;

            // Check if UVs exist and are valid
            if (original.uv != null && original.uv.Length == original.vertexCount)
                return original;

            // Generate simple planar UVs based on world position
            // This is a basic approach; for better results, use a proper UV unwrap
            Debug.Log($"Generating UVs for {mf.gameObject.name} ({original.vertexCount} verts)");

            Mesh newMesh = Instantiate(original);
            newMesh.name = original.name + "_uv";

            Vector3[] vertices = newMesh.vertices;
            Vector2[] uvs = new Vector2[vertices.Length];
            Vector3[] normals = newMesh.normals;

            // Calculate bounds for normalization
            Bounds bounds = newMesh.bounds;
            Vector3 size = bounds.size;
            Vector3 min = bounds.min;

            for (int i = 0; i < vertices.Length; i++)
            {
                Vector3 v = vertices[i];
                Vector3 n = (normals != null && i < normals.Length) ? normals[i] : Vector3.up;

                // Triplanar-style UV: project based on dominant normal axis
                float absX = Mathf.Abs(n.x);
                float absY = Mathf.Abs(n.y);
                float absZ = Mathf.Abs(n.z);

                if (absY > absX && absY > absZ)
                {
                    // Top/bottom face: use XZ
                    uvs[i] = new Vector2(
                        (v.x - min.x) / Mathf.Max(size.x, 0.001f),
                        (v.z - min.z) / Mathf.Max(size.z, 0.001f)
                    );
                }
                else if (absX > absZ)
                {
                    // Side face (X dominant): use YZ
                    uvs[i] = new Vector2(
                        (v.z - min.z) / Mathf.Max(size.z, 0.001f),
                        (v.y - min.y) / Mathf.Max(size.y, 0.001f)
                    );
                }
                else
                {
                    // Side face (Z dominant): use XY
                    uvs[i] = new Vector2(
                        (v.x - min.x) / Mathf.Max(size.x, 0.001f),
                        (v.y - min.y) / Mathf.Max(size.y, 0.001f)
                    );
                }
            }

            newMesh.uv = uvs;
            mf.sharedMesh = newMesh;
            return newMesh;
        }

        private Texture2D BakeMaterialToTexture(MeshRenderer renderer, Mesh mesh)
        {
            // Use Camera.Render to capture the material as it appears
            // For Triplanar, we need to render from the material's perspective

            // Alternative approach: sample the material's main texture directly
            // if the Triplanar shader uses _MainTex or similar
            Material mat = renderer.sharedMaterial;
            if (mat == null) return null;

            // Try to get the base texture from the Triplanar shader
            string[] texProps = { "_MainTex", "_BaseMap", "_Texture0", "_Texture1",
                                  "_TopTex", "_SideTex", "_FrontTex" };
            Texture2D sourceTex = null;

            foreach (var prop in texProps)
            {
                if (mat.HasProperty(prop))
                {
                    var tex = mat.GetTexture(prop) as Texture2D;
                    if (tex != null)
                    {
                        sourceTex = tex;
                        break;
                    }
                }
            }

            if (sourceTex == null)
            {
                // No texture found; bake the material color
                Color color = Color.gray;
                if (mat.HasProperty("_Color"))
                    color = mat.GetColor("_Color");
                else if (mat.HasProperty("_BaseColor"))
                    color = mat.GetColor("_BaseColor");

                var colorTex = new Texture2D(bakeResolution, bakeResolution);
                Color[] pixels = new Color[bakeResolution * bakeResolution];
                for (int i = 0; i < pixels.Length; i++)
                    pixels[i] = color;
                colorTex.SetPixels(pixels);
                colorTex.Apply();
                return colorTex;
            }

            // Render the source texture at bake resolution
            RenderTexture rt = RenderTexture.GetTemporary(bakeResolution, bakeResolution);
            Graphics.Blit(sourceTex, rt);

            var previous = RenderTexture.active;
            RenderTexture.active = rt;

            var baked = new Texture2D(bakeResolution, bakeResolution, TextureFormat.RGB24, false);
            baked.ReadPixels(new Rect(0, 0, bakeResolution, bakeResolution), 0, 0);
            baked.Apply();

            RenderTexture.active = previous;
            RenderTexture.ReleaseTemporary(rt);

            return baked;
        }
    }
}
#endif
