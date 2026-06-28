// Site Neutral Suspension Notice Component for React Rendering
window.App = function App() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0c0a09',
      color: '#ffffff',
      zIndex: 99999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      <div style={{
        maxWidth: '540px',
        width: '100%',
        background: '#1c1917',
        border: '2px solid #ea580c',
        borderRadius: '24px',
        padding: '40px 28px',
        boxShadow: '0 25px 50px -12px rgba(234, 88, 12, 0.25)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          background: 'rgba(234, 88, 12, 0.15)',
          color: '#f97316',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justify.content: 'center',
          margin: '0 auto 20px',
          fontSize: '32px',
          border: '1px solid rgba(249, 115, 22, 0.3)'
        }}>
          🛠️
        </div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '32px',
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 12px',
          letterSpacing: '0.5px'
        }}>
          Website Temporarily Taken Down
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#d6d3d1',
          lineHeight: 1.6,
          margin: '0 0 24px',
          fontWeight: 500
        }}>
          This website services and associated client storefront have been temporarily offline and taken down.
        </p>
        <div style={{
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '16px',
          padding: '18px'
        }}>
          <span style={{
            display: 'block',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#fed7aa',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
            Notice
          </span>
          <div style={{
            fontSize: '15px',
            color: '#ffffff',
            fontWeight: 700
          }}>
            Please contact the web developer for further details and inquiries.
          </div>
        </div>
      </div>
    </div>
  );
};
