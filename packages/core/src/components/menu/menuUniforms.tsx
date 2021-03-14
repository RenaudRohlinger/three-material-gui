

import React, { useEffect, VFC } from 'react';
import { editorContextState as editorContext, editorState } from '../../state';
import { Leva, LevaPanel, useControls, useCreateStore } from "leva";
import { useSnapshot } from 'valtio';
import * as THREE from 'three'
import { makeControls } from '../../helpers/shaderToMaterial';

interface UniformsMenuProps {
}

// foreach
const color = new THREE.Color()
export const UniformsMenu: VFC<UniformsMenuProps> = () => {
  const snapshot = useSnapshot(editorState);
  const [store, setSelection]:any = React.useState(null)

  if (!editorContext.activeMaterialRef || !editorState.activeMaterial.model) {
    return null;
  }
  const activeMat = editorContext.activeMaterialRef[editorState.activeMaterial.model]

  if (!activeMat) {
    return null
  }
  const material: any = activeMat.material;


  if (!editorState.showUniforms || !material.uniforms) {
    return null
  }

  const filteredItems:any = {}

  const improveLevaRange = makeControls(material.vertexShader, material.fragmentShader)

  if (material.uniforms.size && material.uniforms.size > 0) {
    material.uniforms.forEach((uniform: any, key: any) => {
      if (!uniform.isNativeUniforms && key !== 'time') {
        if (improveLevaRange && improveLevaRange[key]) {
          const range = improveLevaRange[key]
          if (!uniform.rangeInitialized) {
            uniform.value = range.value
            uniform.rangeInitialized = true
          }
  
          uniform.min = range.min
          uniform.max = range.max
        } else if (typeof uniform.value === 'number') {
          uniform.min = -1
          uniform.max = 1
        }
        if (uniform.type) {
          delete uniform.type
        }

        if (uniform && uniform.value && uniform.value.image) {
          filteredItems[key] = {image: uniform.value}
          uniform.copyRef = uniform.value.image.currentSrc
        } else if (uniform.value && uniform.value.isColor) {
          const col = uniform.value
          filteredItems[key] = {r: col.r * 255, g: col.g * 255, b: col.b * 255}
        } else {
          filteredItems[key] = uniform
        }
        material.uniforms.set(key, uniform)
        Object.entries(filteredItems[key]).map(([skey, value]) => {
          if (typeof value === 'string') {
            delete filteredItems[key][skey]
          }
        })
      }
    })
  } else if (typeof material.uniforms === 'object') {
    if (Object.keys(material.uniforms).length === 0) {
      return null
    }

    Object.entries(material.uniforms).map(([key, uniform]: any) => {
      if (!uniform.isNativeUniforms && key !== 'time') {
        if (improveLevaRange && improveLevaRange[key]) {
          const range = improveLevaRange[key]
          if (!uniform.rangeInitialized) {
            uniform.value = range.value
            uniform.rangeInitialized = true
          }
  
          uniform.min = range.min
          uniform.max = range.max
        } else if (typeof uniform.value === 'number') {
          uniform.min = Math.min(-1, -Math.round(uniform.value))
          uniform.max = Math.max(1, Math.round(uniform.value))
        }
        if (uniform.type) {
          delete uniform.type
        }
        if (uniform && uniform.value && uniform.value.image) {
          filteredItems[key] = {image: uniform.value}
          uniform.copyRef = uniform.value.image.currentSrc

        } else if (uniform.value && uniform.value.isColor) {
          const col = uniform.value
          filteredItems[key] = {r: col.r * 255, g: col.g * 255, b: col.b * 255}
        } else {
          filteredItems[key] = uniform
        }

        Object.entries(filteredItems[key]).map(([skey, value]) => {
          if (typeof value === 'string') {
            delete filteredItems[key][skey]
          }
        })
      }
    })
  }



  return (
    <div>
      <Leva hideTitleBar />
      <LevaPanel store={store} />
      <div key={snapshot.triggerUpdate}>
        <UniformComp filteredItems={filteredItems} setSelection={setSelection} uniforms={material.uniforms} store={store} />
      </div>
    </div>
  )
};




const loadTexture = (uniforms: any, materialUniform: any, key: string, value: any) => {

  if (materialUniform && materialUniform.value && materialUniform.value.image) {
    if (value && value !== materialUniform.value.image.preventDouble) {
      new THREE.TextureLoader().load(value, (x) => {
        materialUniform.value = x
        materialUniform.value.wrapS = materialUniform.value.wrapT = THREE.RepeatWrapping

        materialUniform.value.image.preventDouble = value
        materialUniform.value.image.isOriginal = false
        materialUniform.value.needsUpdate = true
        setUniformValue(uniforms, materialUniform, key)

      })
    } else if (!value && !materialUniform.value.image.isOriginal) {
      new THREE.TextureLoader().load(materialUniform.copyRef, (x) => {
        materialUniform.value = x
        materialUniform.value.wrapS = materialUniform.value.wrapT = THREE.RepeatWrapping

        materialUniform.value.image.preventDouble = value
        materialUniform.value.image.isOriginal = true
        materialUniform.value.needsUpdate = true
        setUniformValue(uniforms, materialUniform, key)
      })
    }
  }
 
}
const UniformComp = ({filteredItems, uniforms, setSelection} :any) => {
  const store = useCreateStore()
  const [elements] = useControls(() => (filteredItems), { store })


  useEffect(() => {
    for (const [key, value] of Object.entries(elements)) {
      const val:any = value
      var materialUniform = uniforms[key] || uniforms.get(key)

      // is image
      if (typeof value === 'string' || !value) {
        loadTexture(uniforms, materialUniform, key, value)
      } else {

        if (materialUniform) {
          if (val['r'] && val['g'] && val['b']) {
            const factor =  255
            materialUniform.value = color.setRGB(val['r'] / factor, val['g'] / factor, val['b'] / factor)
            setUniformValue(uniforms, materialUniform, key)

          } else {
            materialUniform.value = value
            setUniformValue(uniforms, materialUniform, key)
          }
        }
      }
    }
  }, [elements])

  useEffect(() => {
    setSelection(store)
  }, [store, setSelection])

  return null
}

const setUniformValue = (uniforms: any, materialUniform: any, key: string) => {
  if (!uniforms[key]) {
    uniforms.set(key, materialUniform)
  }
}