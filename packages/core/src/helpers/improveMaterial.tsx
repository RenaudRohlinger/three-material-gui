import {
  getShaderWithObc,
} from './shaderToMaterial';
import * as THREE from 'three'
import { editorContextState } from '../state';

export const addShaderDebugMaterial = (material: any) => {
  let newMaterial = material;
  const shader = getShaderWithObc(newMaterial)
  newMaterial = Object.assign(newMaterial, shader);

  const epoch = Date.now();

  const canvas = editorContextState.gl.domElement;
  const res = new THREE.Vector2(canvas.clientWidth, canvas.clientHeight)

  // wait the first compilation that will inject data into the material shaders
  setTimeout(() => {
    newMaterial.onBeforeCompile = function (shader: any) {
      // troika break if we attribute uniforms
        // sometimes we lose the uniforms ?
        // if (!newMaterial.editorAttributeUniforms) {
        //   newMaterial.editorAttributeUniforms = true
      if (!newMaterial.postprocess) {
        shader.uniforms = Object.assign(shader.uniforms, newMaterial.uniforms);
      }
        // }
      // @ts-ignore
      if (this.editorOnBeforeCompile) {
        // @ts-ignore
        this.editorOnBeforeCompile.call(this, shader)
      }
      // if time detected in obc or material, automatically update the value
      if (shader.uniforms.time && !newMaterial.postprocess) {
        shader.uniforms.time = {
          writable: true,
          configurable: true,
          // @ts-ignore
          get value() {
            return (Date.now() - epoch) / 1000;
          },
        };
      }
      // helper for resolution
      if (shader.uniforms.resolution) {
        shader.uniforms.resolution = {
          writable: true,
          configurable: true,
          // @ts-ignore
          get value() {
            return res
          },
        };
      }
    };
  }, 0);
  return {
    debug: null,
    material: newMaterial,
  };
};
