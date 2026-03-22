// PlateauAtlasBaker.cs
// Copy to: tokyo-playground-plateau/Assets/Editor/PlateauAtlasBaker.cs
//
// Bakes multiple small PLATEAU photogrammetry textures into single atlas textures.
// PLATEAU tiles can have 2000+ small JPGs per tile. This consolidates them into
// 1024x1024 or 2048x2048 atlases suitable for Roblox (which prefers few large textures).

#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace TokyoPlayground.Pipeline
{
    public class PlateauAtlasBaker : EditorWindow
    {
        private int atlasSize = 1024;
        private int padding = 2;
        private bool generateMipMaps = true;

        [MenuItem("PLATEAU Pipeline/Atlas/Open Atlas Baker")]
        public static void ShowWindow()
        {
            GetWindow<PlateauAtlasBaker>("PLATEAU Atlas Baker");
        }

        private void OnGUI()
        {
            GUILayout.Label("Texture Atlas Baker", EditorStyles.boldLabel);
            GUILayout.Space(10);

            atlasSize = EditorGUILayout.IntPopup("Atlas Size",
                atlasSize,
                new string[] { "512x512", "1024x1024", "2048x2048" },
                new int[] { 512, 1024, 2048 });

            padding = EditorGUILayout.IntSlider("Padding (px)", padding, 0, 8);
            generateMipMaps = EditorGUILayout.Toggle("Generate MipMaps", generateMipMaps);

            GUILayout.Space(10);

            if (GUILayout.Button("Preview Atlas (Selected Objects)"))
            {
                PreviewAtlas();
            }

            if (GUILayout.Button("Bake Atlas (Selected Objects)"))
            {
                BakeAtlas();
            }

            GUILayout.Space(10);
            GUILayout.Label("Workflow", EditorStyles.boldLabel);
            GUILayout.Label("1. Select a group of PLATEAU building meshes", EditorStyles.miniLabel);
            GUILayout.Label("2. Click 'Bake Atlas' to combine their textures", EditorStyles.miniLabel);
            GUILayout.Label("3. New material + atlas texture are created", EditorStyles.miniLabel);
            GUILayout.Label("4. Original UVs are remapped to the atlas", EditorStyles.miniLabel);
            GUILayout.Label("Target: 1 texture per area chunk for Roblox", EditorStyles.miniLabel);
        }

        private void PreviewAtlas()
        {
            var textures = CollectTexturesFromSelection();
            Debug.Log($"=== Atlas Preview ===");
            Debug.Log($"Found {textures.Count} unique textures from selection");
            Debug.Log($"Target atlas size: {atlasSize}x{atlasSize}");

            int totalPixels = 0;
            foreach (var tex in textures)
            {
                totalPixels += tex.width * tex.height;
                Debug.Log($"  {tex.name}: {tex.width}x{tex.height}");
            }

            float fillRatio = (float)totalPixels / (atlasSize * atlasSize);
            Debug.Log($"Fill ratio: {fillRatio:P0} (>100% means atlas size is too small)");

            if (fillRatio > 1.0f)
            {
                Debug.LogWarning($"Atlas size {atlasSize}x{atlasSize} is too small. Consider 2048x2048 or split into multiple groups.");
            }
        }

        private void BakeAtlas()
        {
            var selected = Selection.gameObjects;
            if (selected.Length == 0)
            {
                Debug.LogWarning("No objects selected.");
                return;
            }

            // Collect all textures
            var textureList = new List<Texture2D>();
            var rendererList = new List<MeshRenderer>();
            var texToRenderers = new Dictionary<Texture2D, List<int>>();

            for (int i = 0; i < selected.Length; i++)
            {
                var renderer = selected[i].GetComponent<MeshRenderer>();
                if (renderer == null) continue;
                rendererList.Add(renderer);

                foreach (var mat in renderer.sharedMaterials)
                {
                    if (mat == null) continue;
                    Texture2D tex = GetMainTexture(mat);
                    if (tex == null) continue;

                    if (!texToRenderers.ContainsKey(tex))
                    {
                        texToRenderers[tex] = new List<int>();
                        textureList.Add(tex);
                    }
                    texToRenderers[tex].Add(rendererList.Count - 1);
                }
            }

            if (textureList.Count == 0)
            {
                Debug.LogWarning("No textures found on selected objects.");
                return;
            }

            // Make textures readable
            var readableTextures = new List<Texture2D>();
            foreach (var tex in textureList)
            {
                readableTextures.Add(MakeReadable(tex));
            }

            // Pack into atlas
            var atlas = new Texture2D(atlasSize, atlasSize, TextureFormat.RGBA32, generateMipMaps);
            atlas.name = "atlas_" + selected[0].name;

            Rect[] uvRects = atlas.PackTextures(readableTextures.ToArray(), padding, atlasSize);

            if (uvRects == null)
            {
                Debug.LogError("Atlas packing failed. Try a larger atlas size.");
                return;
            }

            // Save atlas texture
            string atlasDir = "Assets/plateau_export/atlases";
            Directory.CreateDirectory(Path.Combine(Application.dataPath, "plateau_export/atlases"));

            string atlasPath = $"{atlasDir}/{atlas.name}.png";
            File.WriteAllBytes(
                Path.Combine(Application.dataPath, $"plateau_export/atlases/{atlas.name}.png"),
                atlas.EncodeToPNG()
            );
            AssetDatabase.Refresh();

            // Create atlas material
            var atlasMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            atlasMat.name = "mat_" + atlas.name;
            var savedAtlas = AssetDatabase.LoadAssetAtPath<Texture2D>(atlasPath);
            atlasMat.SetTexture("_BaseMap", savedAtlas);

            string matPath = $"{atlasDir}/{atlasMat.name}.mat";
            AssetDatabase.CreateAsset(atlasMat, matPath);

            // Remap UVs on meshes
            for (int i = 0; i < rendererList.Count; i++)
            {
                var renderer = rendererList[i];
                var mf = renderer.GetComponent<MeshFilter>();
                if (mf == null || mf.sharedMesh == null) continue;

                Texture2D originalTex = GetMainTexture(renderer.sharedMaterial);
                if (originalTex == null) continue;

                int texIndex = textureList.IndexOf(originalTex);
                if (texIndex < 0) continue;

                Rect rect = uvRects[texIndex];

                // Clone mesh to avoid modifying shared mesh
                var newMesh = Instantiate(mf.sharedMesh);
                newMesh.name = mf.sharedMesh.name + "_atlased";

                // Remap UVs into atlas rect
                var uvs = newMesh.uv;
                for (int j = 0; j < uvs.Length; j++)
                {
                    uvs[j] = new Vector2(
                        rect.x + uvs[j].x * rect.width,
                        rect.y + uvs[j].y * rect.height
                    );
                }
                newMesh.uv = uvs;
                mf.sharedMesh = newMesh;

                // Assign atlas material
                renderer.sharedMaterial = AssetDatabase.LoadAssetAtPath<Material>(matPath);
            }

            Debug.Log($"=== Atlas Baked ===");
            Debug.Log($"Atlas: {atlasPath} ({atlasSize}x{atlasSize})");
            Debug.Log($"Material: {matPath}");
            Debug.Log($"Textures packed: {textureList.Count}");
            Debug.Log($"Meshes remapped: {rendererList.Count}");
        }

        private static Texture2D GetMainTexture(Material mat)
        {
            if (mat == null) return null;
            // Try URP _BaseMap first, then legacy _MainTex
            if (mat.HasProperty("_BaseMap"))
                return mat.GetTexture("_BaseMap") as Texture2D;
            if (mat.HasProperty("_MainTex"))
                return mat.GetTexture("_MainTex") as Texture2D;
            return null;
        }

        private static Texture2D MakeReadable(Texture2D source)
        {
            // If texture is not readable, copy via RenderTexture
            if (source.isReadable) return source;

            RenderTexture rt = RenderTexture.GetTemporary(source.width, source.height);
            Graphics.Blit(source, rt);

            var previous = RenderTexture.active;
            RenderTexture.active = rt;

            var readable = new Texture2D(source.width, source.height);
            readable.ReadPixels(new Rect(0, 0, source.width, source.height), 0, 0);
            readable.Apply();
            readable.name = source.name;

            RenderTexture.active = previous;
            RenderTexture.ReleaseTemporary(rt);

            return readable;
        }

        private List<Texture2D> CollectTexturesFromSelection()
        {
            var texSet = new HashSet<Texture2D>();
            foreach (var go in Selection.gameObjects)
            {
                var renderer = go.GetComponent<MeshRenderer>();
                if (renderer == null) continue;
                foreach (var mat in renderer.sharedMaterials)
                {
                    var tex = GetMainTexture(mat);
                    if (tex != null) texSet.Add(tex);
                }
            }
            return texSet.ToList();
        }
    }
}
#endif
