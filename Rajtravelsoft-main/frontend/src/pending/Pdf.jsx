// ============================================
// 📁 FRONTEND: Optimized Pdf.jsx Component
// ============================================

"use client"

import { useState, useEffect, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url"
import { useSearchParams } from "react-router-dom"

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

const customStyles = `
  .annotationLayer .linkAnnotation {
    cursor: pointer;
    pointer-events: auto;
  }
  .annotationLayer .linkAnnotation:hover {
    background-color: rgba(100, 149, 237, 0.1) !important;
    border: none !important;
  }
  .annotationLayer .linkAnnotation a {
    pointer-events: auto;
    cursor: pointer;
  }
  .annotationLayer .popupAnnotation {
    pointer-events: auto;
  }
  .textLayer {
    pointer-events: auto;
  }
  .textLayer a {
    pointer-events: auto;
    cursor: pointer;
  }

  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    .react-pdf__Page {
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .react-pdf__Page:last-child {
      page-break-after: auto;
    }
    .react-pdf__Page__canvas {
      max-width: 100% !important;
      height: auto !important;
    }
  }
`

const PdfViewer = () => {
  const [searchParams] = useSearchParams()
  const isPrintMode = searchParams.get("print") === "1"

  const [numPages, setNumPages] = useState(null)
  const [pageWidth, setPageWidth] = useState(800)
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visiblePages, setVisiblePages] = useState(new Set([1]))
  const [renderingComplete, setRenderingComplete] = useState(false)
  const containerRef = useRef(null)
  const pageRefs = useRef([])
  const observerRef = useRef(null)
  const renderCountRef = useRef(0)
  const expectedPagesRef = useRef(0)
  const renderTimeoutRef = useRef(null)

  // ✅ Apply custom styles
  useEffect(() => {
    const styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = customStyles
    document.head.appendChild(styleSheet)
    return () => document.head.removeChild(styleSheet)
  }, [])

  // ✅ Worker setup
  useEffect(() => {
    const worker = new Worker(pdfWorker, { type: "module" })
    pdfjs.GlobalWorkerOptions.workerPort = worker
    return () => worker.terminate()
  }, [])

  // ✅ Adjust width dynamically
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        setPageWidth(containerWidth * 0.98)
      }
    }

    updateWidth()
    const handleResize = () => {
      clearTimeout(window.resizeTimeout)
      window.resizeTimeout = setTimeout(updateWidth, 150)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(window.resizeTimeout)
    }
  }, [loaded])

  // ✅ Lazy-load pages ONLY in normal mode
  useEffect(() => {
    if (!loaded || isPrintMode) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = Number.parseInt(entry.target.dataset.page, 10)
            setVisiblePages((prev) => new Set([...prev, pageIndex]))
          }
        })
      },
      { rootMargin: "200px", threshold: 0.01 },
    )

    pageRefs.current.forEach((ref) => {
      if (ref) observerRef.current.observe(ref)
    })

    return () => observerRef.current?.disconnect()
  }, [loaded, numPages, isPrintMode])

  // ✅ PDF callbacks
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setLoaded(true)
    expectedPagesRef.current = numPages
    renderCountRef.current = 0

    // 🔹 In print mode, immediately render all pages
    if (isPrintMode) {
      setVisiblePages(new Set(Array.from({ length: numPages }, (_, i) => i + 1)))
    }
  }

  const onDocumentLoadProgress = ({ loaded: loadedBytes, total: totalBytes }) => {
    if (totalBytes) setProgress(Math.round((loadedBytes / totalBytes) * 100))
  }

  // ✅ OPTIMIZED: Track page rendering with smart completion detection
  const onPageRenderSuccess = () => {
    renderCountRef.current += 1
    const currentRendered = renderCountRef.current

    // In print mode, check if we're done
    if (isPrintMode && expectedPagesRef.current > 0) {
      // Clear existing timeout
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }

      // ✅ Wait for images to load in print mode
      const waitForImages = () => {
        return new Promise((resolve) => {
          const images = document.querySelectorAll('img');
          let loadedCount = 0;
          let errorCount = 0;

          if (images.length === 0) {
            resolve();
            return;
          }

          images.forEach((img) => {
            const checkImage = () => {
              if (img.complete) {
                loadedCount++;
                if (loadedCount + errorCount >= images.length) resolve();
              }
            };

            if (img.complete) {
              loadedCount++;
            } else {
              img.onload = () => {
                loadedCount++;
                if (loadedCount + errorCount >= images.length) resolve();
              };
              img.onerror = () => {
                errorCount++;
                if (loadedCount + errorCount >= images.length) resolve();
              };
            }
          });

          // Timeout after 15 seconds anyway
          setTimeout(resolve, 15000);

          // Check immediately
          checkImage();
        });
      };

      // If we have most pages, signal after images load
      const percentComplete = (currentRendered / expectedPagesRef.current) * 100

      if (percentComplete >= 75) {
        renderTimeoutRef.current = setTimeout(async () => {
          await waitForImages();
          window.pdfFullyRendered = true
          console.log(`✅ ${currentRendered}/${expectedPagesRef.current} PDF pages rendered + images loaded!`)
          document.dispatchEvent(new Event('pdfFullyRendered'))
        }, 300)
      }

      // Also check if all pages are complete
      if (currentRendered === expectedPagesRef.current) {
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current)
        }
        renderTimeoutRef.current = setTimeout(async () => {
          await waitForImages();
          window.pdfFullyRendered = true
          console.log(`✅ All ${currentRendered} PDF pages rendered + images loaded!`)
          document.dispatchEvent(new Event('pdfFullyRendered'))
        }, 200)
      }
    }
  }

  // ✅ Styles
  const pageContainerStyle = {
    borderRadius: "8px",
    overflow: "hidden",
    width: "100%",
    display: "flex",
    justifyContent: "center",
  }

  const pagePlaceholderStyle = {
    height: "1200px",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    fontSize: "14px",
  }

  return (
    <div>
      <h1 className="text-center text-lg text-gray-500 font-bold  my-4 underline">Campany Details</h1>
      <div
        ref={containerRef}
        style={{
          height: isPrintMode ? "auto" : "100vh",
          width: "100%",
          overflowY: isPrintMode ? "visible" : "auto",
          backgroundColor: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          padding: isPrintMode ? "0" : "0rem",
        }}
      >


        <Document
          file="/pdf_compressed.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadProgress={onDocumentLoadProgress}
          loading={null}
          error={
            <div
              style={{
                marginTop: "30vh",
                textAlign: "center",
                fontSize: "16px",
                color: "#f00",
              }}
            >
              Please try again.
            </div>
          }
        >
          {loaded &&
            Array.from(new Array(numPages), (_, index) => {
              const pageNum = index + 1
              const isVisible = visiblePages.has(pageNum)

              return (
                <div
                  key={`page_${pageNum}`}
                  ref={(el) => (pageRefs.current[index] = el)}
                  data-page={pageNum}
                  style={pageContainerStyle}
                >
                  {isVisible ? (
                    <Page
                      pageNumber={pageNum}
                      width={pageWidth}
                      renderAnnotationLayer={true}
                      renderTextLayer={true}
                      scale={1}
                      onRenderSuccess={onPageRenderSuccess}
                    />
                  ) : (
                    <div style={pagePlaceholderStyle}></div>
                  )}
                </div>
              )
            })}
        </Document>
      </div>
    </div>
  )
}

export default PdfViewer