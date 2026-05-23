"use client"

import { useEffect, useRef, useState } from "react"
import API from "../services/api"
import ModalPortal from "./ModalPortal"

// Prefer a reliable CDN first, then fall back. You can also host these files in /public/face-models and add "/face-models" as first entry.
const CANDIDATES_STATIC = [
  // Known CORS-friendly sources first
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights",
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/0.22.2/weights",
  // npm CDNs are less reliable for weights, keep as last resort
  "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights",
]

// Replace MODEL_BASES/resolveModelBase with robust JSON probe
const KNOWN_MANIFEST = "tiny_face_detector_model-weights_manifest.json"

async function probeBaseJSON(base) {
  const url = `${base.replace(/\/$/, "")}/${KNOWN_MANIFEST}`
  try {
    const res = await fetch(url, { method: "GET", mode: "cors", cache: "no-store" })
    if (!res.ok) {
      console.warn("[v0] Probe non-OK:", res.status, url)
      return null
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase()
    if (!ct.includes("application/json")) {
      console.warn("[v0] Probe wrong content-type:", ct, url)
      return null
    }
    await res.json() // ensure valid JSON
    return base
  } catch (e) {
    console.warn("[v0] Probe failed:", url, e?.message || e)
    return null
  }
}

async function resolveModelBase() {
  const dynamicSelfHost = `${window.location.origin}/face-models` // works only if you actually upload files there
  const candidates = [...CANDIDATES_STATIC, dynamicSelfHost]

  for (const base of candidates) {
    const ok = await probeBaseJSON(base)
    if (ok) {
      console.log("[v0] Using face model base:", ok)
      return ok
    }
  }
  throw new Error("No reachable face model source with valid JSON")
}

export default function FaceModal({ open, mode = "verify", enrollViaApi = true, onClose, onVerified, onEnrolled, onBypass }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [modelsReady, setModelsReady] = useState(false)

  // Helper: try multiple bases until one succeeds
  const loadModelsWithFallback = async (faceapi) => {
    const base = await resolveModelBase()
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(base),
        faceapi.nets.faceLandmark68Net.loadFromUri(base),
        faceapi.nets.faceRecognitionNet.loadFromUri(base),
      ])
      console.log("[v0] Face models loaded from:", base)
      return true
    } catch (e) {
      console.error("[v0] Model load error from chosen base:", base, e)
      throw e
    }
  }

  useEffect(() => {
    if (!open) return
    let canceled = false

    const start = async () => {
      try {
        setError("")
        const faceapi = (await import("face-api.js")).default || (await import("face-api.js"))

        if (!modelsReady) {
          try {
            await loadModelsWithFallback(faceapi)
            if (canceled) return
            setModelsReady(true)
          } catch (e) {
            console.error("[v0] Model load error:", e)
            setError(
              "Failed to load face recognition models. Please try again. Tip: host models under /face-models for best reliability.",
            )
            return
          }
        }

        // Ask for camera only after models are ready
        try {
          if (!navigator.mediaDevices?.getUserMedia) {
            setError("Camera API not available in this browser. Please use a modern browser over HTTPS.")
            return
          }
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          })
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.setAttribute("playsinline", "true")
            try {
              await videoRef.current.play()
            } catch (playErr) {
              console.warn("[v0] video.play() warning:", playErr?.message || playErr)
            }
          }
        } catch (camErr) {
          console.error("[v0] Camera access error:", camErr)
          const msg =
            camErr?.name === "NotAllowedError"
              ? "Camera permission denied. Please allow access and try again."
              : "Unable to access camera. Ensure no other app is using it and that you're on HTTPS."
          setError(msg)
          return
        }
      } catch (e) {
        console.error("[v0] Face modal init error:", e)
        setError("Failed to start face recognition. Please try again.")
      }
    }

    start()
    return () => {
      canceled = true
      // stop camera if running
      if (streamRef.current) {
        try {
          streamRef.current.getTracks()?.forEach((t) => t.stop())
        } catch {}
        streamRef.current = null
      }
    }
  }, [open, modelsReady])

  const captureAndProcess = async () => {
    setLoading(true)
    setError("")
    try {
      const faceapi = (await import("face-api.js")).default || (await import("face-api.js"))
      const video = videoRef.current
      if (!video || !video.srcObject) {
        setError("Camera not ready. Please allow camera access.")
        setLoading(false)
        return
      }

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setError("No face detected. Align face in the frame and try again.")
        setLoading(false)
        return
      }

      const dims = faceapi.matchDimensions(canvasRef.current, video, true)
      const resized = faceapi.resizeResults(detection, dims)
      faceapi.draw.drawDetections(canvasRef.current, resized)
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized)

      const embedding = Array.from(detection.descriptor)

      // Helper: detect face-related error messages so they always render as the consistent
      // red alert box (face_mismatch), never as a second plain-text error below it.
      const resolveFaceError = (err) => {
        const raw = err?.response?.data?.message || err?.message || ""
        return /face|match|verif|biometric|enroll|recogni/i.test(raw)
          ? "face_mismatch"
          : raw || "Action failed. Please try again."
      }

      if (mode === "enroll") {
        if (enrollViaApi) {
          console.log("[v0] Enrolling face…")
          const res = await API.post("/face/enroll", {
            embedding,
            modelVersion: "face-api-0.22.2",
          })
          console.log("[v0] Enroll success for user:", res?.data?.user?._id || "unknown")
          try {
            await onEnrolled?.({ user: res.data.user, embedding })
            onClose?.()
          } catch (actionErr) {
            setError(resolveFaceError(actionErr))
          }
        } else {
          console.log("[v0] Captured enrollment face locally (capture-only).")
          try {
            await onEnrolled?.(embedding)
            onClose?.()
          } catch (actionErr) {
            setError(resolveFaceError(actionErr))
          }
        }
      } else {
        console.log("[v0] Verifying face…")
        const res = await API.post("/face/verify", { embedding })
        console.log("[v0] Verify response:", res?.data)
        if (res.data.verified) {
          try {
            // onVerified runs checkin/checkout and closes modal on success
            // If it throws (e.g. server-side face check fails), show error in card
            await onVerified?.(embedding)
            onClose?.()
          } catch (actionErr) {
            setError(resolveFaceError(actionErr))
          }
        } else {
          setError("face_mismatch")
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.error("[v0] Face processing error:", e)
      const msg =
        typeof e?.message === "string" && /load|model|fetch|json/i.test(e.message)
          ? "Model download failed. Please reload and try again."
          : "Failed to process face. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{mode === "enroll" ? "Enroll Your Face" : "Face Verification"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close face modal">
            ✕
          </button>
        </div>
        <div className="p-5">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Center your face, ensure good lighting, and keep still. We will capture one frame to proceed.
          </p>

          {/* Error / mismatch feedback */}
          {error && (
            error === "face_mismatch" ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <span className="mt-0.5 text-red-500 text-base leading-none">✖</span>
                <div>
                  <p className="text-sm font-semibold text-red-700">Face did not match</p>
                  <p className="text-xs text-red-600 mt-0.5">Please reposition your face and try capturing again.</p>
                </div>
              </div>
            ) : (
              <p className="text-sm mt-2 text-red-600">{error}</p>
            )
          )}

          <div className="mt-4 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md border" type="button">
              Cancel
            </button>
            <button
              onClick={captureAndProcess}
              disabled={loading || !modelsReady}
              className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
              type="button"
            >
              {loading ? "Processing..." : error === "face_mismatch" ? "Try Again" : mode === "enroll" ? "Capture & Enroll" : "Capture & Verify"}
            </button>
          </div>

          {/* ── DEV BYPASS ── Remove or comment out this block before going to production ── */}
          <div className="mt-3 pt-3 border-t border-dashed border-amber-300">
            <button
              onClick={async () => {
                if (loading) return
                try {
                  if (onBypass) {
                    await onBypass()
                  } else if (mode === "enroll") {
                    await onEnrolled?.({ embedding: null, user: null })
                  } else {
                    await onVerified?.(null)
                  }
                } catch (e) {
                  console.error("[DEV] Bypass error:", e)
                }
              }}
              disabled={loading}
              type="button"
              className="w-full py-1.5 rounded-md border border-dashed border-amber-400 text-amber-700 text-xs font-medium hover:bg-amber-50 disabled:opacity-40 transition-colors"
            >
              🧪 Skip Face Verification — Dev Only
            </button>
          </div>
          {/* ── END DEV BYPASS ── */}

        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
