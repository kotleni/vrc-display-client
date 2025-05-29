import random

def generate_vrcfury_pixel_prefab(grid_size=15, base_game_object_id="6064328911703741631", vrcfury_script_guid="d9e94e501a2d4c95bff3d5601013d923"):
    output_yaml = []

    # Initial GameObject structure (mostly copied, component list will be extended)
    output_yaml.append(f"""%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &{base_game_object_id}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  serializedVersion: 6
  m_Component:
  - component: {{fileID: 7563181171596979538}}
  - component: {{fileID: 5969414124520764941}}
  - component: {{fileID: 2267668379693781408}}
  - component: {{fileID: 2181152462839082304}}""")

    # Generate component fileIDs for VRCFury MonoBehaviours
    component_file_ids = []
    start_fid_mono = 1000000000000000000 # Starting FileID for MonoBehaviours
    for i in range(grid_size * grid_size):
        fid = start_fid_mono + (i * 2) # Increment by 2, assuming unique FIDs are needed this way for VRCFury component.
        component_file_ids.append(fid)
        output_yaml.append(f"  - component: {{fileID: {fid}}}")

    output_yaml.append(f"""  m_Layer: 0
  m_Name: ScreenSurface
  m_TagString: Untagged
  m_Icon: {{fileID: 0}}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &7563181171596979538
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {base_game_object_id}}}
  serializedVersion: 2
  m_LocalRotation: {{x: -0.7071068, y: 0, z: 0, w: 0.7071068}}
  m_LocalPosition: {{x: 69.3, y: 234, z: 1}}
  m_LocalScale: {{x: 15.692, y: 15.692, z: 15.692}}
  m_ConstrainProportionsScale: 1
  m_Children: []
  m_Father: {{fileID: 0}}
  m_LocalEulerAnglesHint: {{x: -90, y: 0, z: 0}}
--- !u!33 &5969414124520764941
MeshFilter:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {base_game_object_id}}}
  m_Mesh: {{fileID: 10209, guid: 0000000000000000e000000000000000, type: 0}}
--- !u!23 &2267668379693781408
MeshRenderer:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {base_game_object_id}}}
  m_Enabled: 1
  m_CastShadows: 1
  m_ReceiveShadows: 1
  m_DynamicOccludee: 1
  m_StaticShadowCaster: 0
  m_MotionVectors: 1
  m_LightProbeUsage: 1
  m_ReflectionProbeUsage: 1
  m_RayTracingMode: 2
  m_RayTraceProcedural: 0
  m_RenderingLayerMask: 1
  m_RendererPriority: 0
  m_Materials:
  - {{fileID: 2100000, guid: 3a805960e32314c7983a015d5d8eaeed, type: 2}}
  m_StaticBatchInfo:
    firstSubMesh: 0
    subMeshCount: 0
  m_StaticBatchRoot: {{fileID: 0}}
  m_ProbeAnchor: {{fileID: 0}}
  m_LightProbeVolumeOverride: {{fileID: 0}}
  m_ScaleInLightmap: 1
  m_ReceiveGI: 1
  m_PreserveUVs: 0
  m_IgnoreNormalsForChartDetection: 0
  m_ImportantGI: 0
  m_StitchLightmapSeams: 1
  m_SelectedEditorRenderState: 3
  m_MinimumChartSize: 4
  m_AutoUVMaxDistance: 0.5
  m_AutoUVMaxAngle: 89
  m_LightmapParameters: {{fileID: 0}}
  m_SortingLayerID: 0
  m_SortingLayer: 0
  m_SortingOrder: 0
  m_AdditionalVertexStreams: {{fileID: 0}}
--- !u!64 &2181152462839082304
MeshCollider:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {base_game_object_id}}}
  m_Material: {{fileID: 0}}
  m_IncludeLayers:
    serializedVersion: 2
    m_Bits: 0
  m_ExcludeLayers:
    serializedVersion: 2
    m_Bits: 0
  m_LayerOverridePriority: 0
  m_IsTrigger: 0
  m_ProvidesContacts: 0
  m_Enabled: 1
  serializedVersion: 5
  m_Convex: 0
  m_CookingOptions: 30
  m_Mesh: {{fileID: 10209, guid: 0000000000000000e000000000000000, type: 0}}""")

    # Generate VRCFury MonoBehaviour components
    # RIDs need to be unique within the scope of what VRCFury processes for this object.
    # We'll generate large-ish random numbers for RIDs for simplicity,
    # assuming they won't collide with your existing small RIDs.
    # A more robust solution might involve parsing existing RIDs or a sequential scheme.
    start_rid_base = random.randint(3000000000000000000, 4000000000000000000) # Large random base

    component_idx = 0
    for r in range(grid_size):
        for c in range(grid_size):
            mono_fid = component_file_ids[component_idx]
            
            # Generate unique RIDs for this component's internal references
            # Each VRCFury component on the same GameObject typically shares the same `content.rid`
            # but the items within `references.RefIds` have their own unique RIDs.
            # For simplicity, we are creating a new "content" (and thus new feature + action) per MonoBehaviour.
            # This is how it looks if you add multiple Toggles in the Unity Inspector.
            
            content_rid = start_rid_base + component_idx * 10 # Ensure content_rid is unique for each MonoBehaviour
            toggle_rid = content_rid 
            action_rid = content_rid + 1 # Action RID is often +1 from its owning Feature's RID in simple cases

            param_name = f"Pixel_{r}_{c}"
            shader_prop_name = f"_P{r}_{c}"

            output_yaml.append(f"""--- !u!114 &{mono_fid}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {base_game_object_id}}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {{fileID: 11500000, guid: {vrcfury_script_guid}, type: 3}}
  m_Name: 
  m_EditorClassIdentifier: 
  version: 3
  unityVersion: 2022.3.22f1
  vrcfuryVersion: 1.1229.0
  somethingIsBroken: 0
  config:
    features: []
  content:
    rid: {toggle_rid}
  references:
    version: 2
    RefIds:
    - rid: {toggle_rid}
      type: {{class: Toggle, ns: VF.Model.Feature, asm: VRCFury}}
      data:
        version: 3
        name: {param_name}
        state:
          actions:
          - rid: {action_rid}
        saved: 0
        slider: 0
        sliderInactiveAtZero: 1
        securityEnabled: 0
        defaultOn: 0
        includeInRest: 0
        exclusiveOffState: 0
        enableExclusiveTag: 0
        exclusiveTag: 
        resetPhysbones: []
        hasExitTime: 0
        enableIcon: 0
        icon:
          version: 1
          fileID: 0
          guid: 
          id: 
          objRef: {{fileID: 0}}
        enableDriveGlobalParam: 1
        driveGlobalParam: {param_name}
        separateLocal: 0
        localState:
          actions: []
        hasTransition: 0
        transitionStateIn:
          actions: []
        transitionStateOut:
          actions: []
        transitionTimeIn: 0
        transitionTimeOut: 0
        localTransitionStateIn:
          actions: []
        localTransitionStateOut:
          actions: []
        localTransitionTimeIn: 0
        localTransitionTimeOut: 0
        simpleOutTransition: 1
        defaultSliderValue: 0
        useGlobalParam: 1
        globalParam: {param_name}
        holdButton: 0
        invertRestLogic: 0
        expandIntoTransition: 1
    - rid: {action_rid}
      type: {{class: MaterialPropertyAction, ns: VF.Model.StateAction, asm: VRCFury}}
      data:
        version: 2
        desktopActive: 0
        androidActive: 0
        localOnly: 0
        remoteOnly: 0
        renderer: {{fileID: 0}}
        renderer2: {{fileID: {base_game_object_id}}}
        affectAllMeshes: 0
        propertyName: {shader_prop_name}
        propertyType: 0
        value: 1
        valueVector: {{x: 0, y: 0, z: 0, w: 0}}
        valueColor: {{r: 1, g: 1, b: 1, a: 1}}""")
            component_idx += 1
            
    return "\n".join(output_yaml)

if __name__ == "__main__":
    GRID_SIZE = 15
    generated_prefab_content = generate_vrcfury_pixel_prefab(grid_size=GRID_SIZE)
    print(generated_prefab_content)
    # with open("ScreenSurface_Generated.prefab", "w") as f:
    #     f.write(generated_prefab_content)
