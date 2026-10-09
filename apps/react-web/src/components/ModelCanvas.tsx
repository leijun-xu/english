import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface ModelCanvasProps {
  model: 'hologram' | 'login' | 'register'
  className?: string
}

export function ModelCanvas({ model, className }: ModelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    camera.position.set(model === 'hologram' ? 0 : 1, model === 'hologram' ? 0 : 0.5, model === 'hologram' ? 10 : 1)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setAvailable(false)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    let lastFrameTime = performance.now()
    let mixer: THREE.AnimationMixer | undefined
    let frame = 0

    scene.add(new THREE.AmbientLight(0xffffff, 1.5))
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    new GLTFLoader().load(
      `/models/${model}/scene.gltf`,
      (gltf) => {
        gltf.scene.position.y = model === 'hologram' ? 0 : -0.8
        const scale = model === 'hologram' ? 4 : 0.8
        gltf.scene.scale.setScalar(scale)
        scene.add(gltf.scene)
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(gltf.scene)
          gltf.animations.forEach((clip) => mixer?.clipAction(clip).play())
        }
      },
      undefined,
      () => setAvailable(false),
    )

    const resize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const animate = (time: number) => {
      frame = requestAnimationFrame(animate)
      const delta = Math.min((time - lastFrameTime) / 1000, 0.1)
      lastFrameTime = time
      mixer?.update(delta)
      scene.rotation.y += 0.002
      controls.update()
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
    }
  }, [model])

  if (!available) {
    return (
      <div className={`model-fallback ${className ?? ''}`} role="img" aria-label="English learning assistant">
        <span>E</span>
      </div>
    )
  }

  return <canvas ref={canvasRef} className={className} aria-label="3D learning assistant" />
}
