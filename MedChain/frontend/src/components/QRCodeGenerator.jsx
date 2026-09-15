import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

function QRCodeGenerator() {
  const [qrValue, setQrValue] = useState('MedChain-Demo')
  const [inputValue, setInputValue] = useState('')
  const qrRef = useRef()

  const generateQR = () => {
    if (inputValue.trim()) {
      setQrValue(inputValue)
      setInputValue('')
    }
  }

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `QRCode_${Date.now()}.png`
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '500px' }}>
      <h2>QR Code Generator</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter data for QR code (batch number, medicine name, etc.)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateQR()}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <button
          onClick={generateQR}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Generate QR Code
        </button>
        <button
          onClick={downloadQR}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f680ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Download
        </button>
      </div>

      <div
        ref={qrRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}
      >
        <QRCodeSVG
          value={qrValue}
          size={256}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      <p style={{ marginTop: '15px', color: '#666', fontSize: '12px' }}>
        Current Value: <strong>{qrValue}</strong>
      </p>
    </div>
  )
}

export default QRCodeGenerator
