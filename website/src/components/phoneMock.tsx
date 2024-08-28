import React from 'react'

const mockupPhone = {
    display: 'block',
    border: '4px solid #444',
    borderRadius: '50px',
    backgroundColor: '#000',
    padding: '10px',
    margin: '0 auto 20px',
    overflow: 'hidden',
    width: '320px',
}

const camera = {
    position: 'relative' as const,
    top: 0,
    left: 0,
    background: '#000',
    height: '25px',
    width: '150px',
    margin: '0 auto',
    borderBottomLeftRadius: '17px',
    borderBottomRightRadius: '17px',
    zIndex: 11
}

const display = {
    overflow: 'hidden',
    borderRadius: '40px',
    marginTop: '-25px',
    backgroundColor: '#fff'
}

const artboard = {
    width: '320px',
    height: '568px',
    display: 'block',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center'
}

export function PhoneMock ({ children }) {
    return <div style={mockupPhone}>
        <div style={camera}></div>
        <div style={display}>
            <div style={artboard}>
                { children }
            </div>
        </div>
    </div>
}
