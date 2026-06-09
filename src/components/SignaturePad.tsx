import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function SignaturePad({
  onSave,
  onClear,
}: {
  onSave: (file: File) => void
  onClear: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(getX(e), getY(e))
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(getX(e), getY(e))
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const getX = (e: any) => {
    if (e.touches && e.touches.length > 0) {
      return e.touches[0].clientX - e.target.getBoundingClientRect().left
    }
    return e.clientX - e.target.getBoundingClientRect().left
  }

  const getY = (e: any) => {
    if (e.touches && e.touches.length > 0) {
      return e.touches[0].clientY - e.target.getBoundingClientRect().top
    }
    return e.clientY - e.target.getBoundingClientRect().top
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
    onClear()
  }

  const save = () => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'signature.png', { type: 'image/png' })
          onSave(file)
        }
      })
    }
  }

  return (
    <div className="space-y-2 flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="border border-slate-300 rounded-md bg-white touch-none max-w-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-2 w-full max-w-[300px]">
        <Button size="sm" variant="outline" className="flex-1" onClick={clear}>
          Limpar
        </Button>
        <Button size="sm" className="flex-1" onClick={save}>
          Salvar Assinatura
        </Button>
      </div>
    </div>
  )
}
