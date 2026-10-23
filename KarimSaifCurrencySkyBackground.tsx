/**
 * Made with 💛 by Karim Saif
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
"use client"

import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer, useReducedMotion } from "framer"

type Props = {
    style?: React.CSSProperties
    backgroundColor: string
    dimColor: string
    lowColor: string
    midColor: string
    brightColor: string
    glyphPreset: string
    customGlyphs: string
    speed: number
    opacity: number
    cellWidth: number
    cellHeight: number
    fontSize: number
    fontFamily: string
    terrainScale: number
    contourSpacing: number
    contourWidth: number
    contrast: number
    brightness: number
    paused: boolean
    frameRate: number
    maxDpr: number
    maxCells: number
    cursorEnabled: boolean
    cursorRadius: number
    cursorStrength: number
    cursorSmoothness: number
}

type PointerState = {
    x: number
    y: number
    targetX: number
    targetY: number
    influence: number
    targetInfluence: number
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const safe = (n: number, fallback: number, lo: number, hi: number) => Number.isFinite(n) ? clamp(n, lo, hi) : fallback

function wave(x: number, y: number, t: number): number {
    return Math.sin(.8*x+.3*t)*Math.cos(.6*y+.2*t)*.5
        + .25*Math.sin(1.6*x+1.2*y+.15*t)
        + Math.sin(.3*x-.4*t)*Math.cos(.4*y+.25*t)*.6
        + .3*Math.sin(.5*(x+y)+.35*t)
        + .15*Math.sin(2.5*x+.1*t)*Math.cos(2.8*y-.12*t)
}

function intensity(x: number, y: number, t: number, spacing: number, thickness: number, contrast: number, brightness: number): number {
    const f = wave(x,y,t)+.4*wave(x*2.2,y*2.2,t*.7)+.15*wave(x*4.5,y*4.5,t*.4)
    const v = clamp((clamp((f+1.8)/3.6,0,1)-.5)*contrast+.5,0,1)
    const band = (v%spacing)/spacing
    const contour = band<thickness || band>1-thickness
    let result = contour ? 200*v+55 : 140*v
    if (contour) {
        const dx = wave(x+.01,y,t)-wave(x-.01,y,t)
        const dy = wave(x,y+.01,t)-wave(x,y-.01,t)
        const slope = 12*Math.hypot(dx,dy)
        if (slope>.5) result+=40*slope
    }
    return clamp(result*brightness,0,255)
}

function characters(preset: string, custom: string): string[] {
    const options: Record<string,string[]> = {
        currency:["·","/","$","£"], dollar:["·","/","$","$"],
        euro:["·","/","€","€"], pound:["·","/","£","£"],
        yen:["·","/","¥","¥"], crypto:["·",":","₿","₿"],
        symbols:["·","+","×","◆"], binary:[".","0","1","1"],
        ascii:[".",":","*","#"],
    }
    if (preset!=="custom") return options[preset] || options.currency
    const chars=Array.from(custom||"").filter(c=>c.trim().length>0)
    return [chars[0]||"·",chars[1]||"/",chars[2]||"$",chars[3]||"£"]
}

function gridSize(w:number,h:number,cw:number,ch:number,limit:number) {
    let scale=1, columns=0,rows=0
    do {
        columns=Math.ceil(w/(cw*scale))+1
        rows=Math.ceil(h/(ch*scale))+1
        if(columns*rows<=limit) break
        scale*=Math.max(1.05,Math.sqrt(columns*rows/limit)*1.01)
    } while(true)
    return { columns,rows,cw:cw*scale,ch:ch*scale }
}

export default function KarimSaifCurrencySkyBackground(props:Props) {
    const hostRef=React.useRef<HTMLDivElement>(null)
    const canvasRef=React.useRef<HTMLCanvasElement>(null)
    const elapsedRef=React.useRef(0)
    const pointerRef=React.useRef<PointerState>({
        x:-10000,y:-10000,targetX:-10000,targetY:-10000,influence:0,targetInfluence:0,
    })
    const staticRenderer=useIsStaticRenderer()
    const reducedMotion=useReducedMotion()
    const still=staticRenderer||reducedMotion===true

    const glyphs=React.useMemo(()=>{
        const chars=characters(props.glyphPreset,props.customGlyphs)
        return [
            {min:15,char:chars[0],color:props.dimColor},
            {min:50,char:chars[1],color:props.lowColor},
            {min:100,char:chars[2],color:props.midColor},
            {min:160,char:chars[3],color:props.brightColor},
        ]
    },[props.glyphPreset,props.customGlyphs,props.dimColor,props.lowColor,props.midColor,props.brightColor])

    React.useEffect(()=>{
        const host=hostRef.current
        const canvas=canvasRef.current
        if(!host||!canvas) return
        const ctx=canvas.getContext("2d")
        if(!ctx) return

        const cw=safe(props.cellWidth,12,4,100)
        const ch=safe(props.cellHeight,14,4,100)
        const size=safe(props.fontSize,12,4,100)
        const scale=safe(props.terrainScale,.13,.001,2)
        const spacing=safe(props.contourSpacing,.08,.005,1)
        const thickness=safe(props.contourWidth,.12,.01,.49)
        const speed=safe(props.speed,.9,0,10)
        const opacity=safe(props.opacity,1,0,1)
        const fps=safe(props.frameRate,30,1,60)
        const maxDpr=safe(props.maxDpr,2,1,2)
        const limit=safe(props.maxCells,14000,1000,50000)
        const radius=safe(props.cursorRadius,180,1,1000)
        const strength=safe(props.cursorStrength,1.5,0,5)
        const smoothing=safe(props.cursorSmoothness,.12,.01,1)
        const pointer=pointerRef.current
        const enabled=props.cursorEnabled&&!still&&!props.paused&&strength>0
        if(!enabled) {
            pointer.influence=0
            pointer.targetInfluence=0
        }
        if(still) elapsedRef.current=0

        let width=0,height=0,columns=0,rows=0,stepX=cw,stepY=ch
        let dpr=0,frame=0,lastTick=0,lastDraw=0,visible=true,disposed=false
        const buckets:number[][]=glyphs.map(()=>[])
        const maxPixels=4000000
        const maxDimension=8192

        const settled=()=>enabled&&(Math.abs(pointer.influence-pointer.targetInfluence)>.001||
            (pointer.targetInfluence>0&&Math.hypot(pointer.x-pointer.targetX,pointer.y-pointer.targetY)>.25))
        const active=()=>!disposed&&!still&&!props.paused&&visible&&!document.hidden&&width>0&&height>0&&(speed>0||settled())
        const draw=()=>{
            if(disposed||width<=0||height<=0) return
            ctx.clearRect(0,0,width,height)
            const font=`400 ${size}px ${props.fontFamily||"monospace"}`
            ctx.font=font
            if(!ctx.font||!ctx.font.includes(`${size}px`)) ctx.font=`400 ${size}px monospace`
            ctx.textAlign="center"
            ctx.textBaseline="middle"
            ctx.globalAlpha=opacity
            for(const bucket of buckets) bucket.length=0
            const cursor=enabled&&pointer.influence>.001
            const r2=radius*radius
            for(let row=0;row<rows;row++){
                const by=row*stepY+stepY/2
                for(let col=0;col<columns;col++){
                    const bx=col*stepX+stepX/2
                    let sx=(col+.5)*scale,sy=(row+.5)*scale,px=bx,py=by
                    if(cursor){
                        const dx=bx-pointer.x,dy=by-pointer.y
                        const d2=dx*dx+dy*dy
                        if(d2<r2){
                            const distance=Math.sqrt(d2)
                            const n=distance/radius
                            const influence=(1-n)*(1-n)*(1+2*n)*strength*pointer.influence
                            const ux=dx/Math.max(1,distance),uy=dy/Math.max(1,distance)
                            const displacement=influence*radius*.2
                            px+=ux*displacement
                            py+=uy*displacement
                            sx+=ux*influence*.85
                            sy+=uy*influence*.85
                        }
                    }
                    const val=intensity(sx,sy,elapsedRef.current,spacing,thickness,props.contrast,props.brightness)
                    for(let i=glyphs.length-1;i>=0;i--){
                        if(val>=glyphs[i].min){buckets[i].push(px,py);break}
                    }
                }
            }
            for(let i=0;i<glyphs.length;i++){
                ctx.fillStyle=glyphs[i].color
                const bucket=buckets[i]
                for(let j=0;j<bucket.length;j+=2) ctx.fillText(glyphs[i].char,bucket[j],bucket[j+1])
            }
            ctx.globalAlpha=1
        }
        const easePointer=(dt:number)=>{
            if(!enabled) return
            const k=1-Math.pow(1-smoothing,dt*60)
            if(pointer.targetInfluence>0){
                pointer.x+=(pointer.targetX-pointer.x)*k
                pointer.y+=(pointer.targetY-pointer.y)*k
                if(Math.abs(pointer.x-pointer.targetX)<.25) pointer.x=pointer.targetX
                if(Math.abs(pointer.y-pointer.targetY)<.25) pointer.y=pointer.targetY
            }
            pointer.influence+=(pointer.targetInfluence-pointer.influence)*k
            if(Math.abs(pointer.influence-pointer.targetInfluence)<.001) pointer.influence=pointer.targetInfluence
        }
        const tick=(now:number)=>{
            frame=0
            if(!active()) return
            const dt=Math.min(.1,Math.max(0,(now-lastTick)/1000))
            lastTick=now
            if(speed>0) elapsedRef.current+=dt*speed
            easePointer(dt)
            if(now-lastDraw>=1000/fps){
                draw()
                lastDraw=now
            }
            if(active()) frame=requestAnimationFrame(tick)
            else draw()
        }
        const start=()=>{
            if(frame||!active()) return
            lastTick=performance.now()
            lastDraw=0
            frame=requestAnimationFrame(tick)
        }
        const refresh=()=>{
            if(frame){cancelAnimationFrame(frame);frame=0}
            lastTick=0;lastDraw=0
            draw()
            start()
        }
        const resize=()=>{
            if(disposed) return
            const rect=host.getBoundingClientRect()
            const w=Math.max(0,rect.width),h=Math.max(0,rect.height)
            const desired=Math.min(window.devicePixelRatio||1,maxDpr)
            const effective=Math.min(desired,w>0&&h>0?Math.sqrt(maxPixels/(w*h)):desired,maxDimension/Math.max(w,1),maxDimension/Math.max(h,1))
            const ratio=Math.max(.01,effective)
            if(w===width&&h===height&&Math.abs(dpr-ratio)<.0001&&canvas.width>0) return
            width=w;height=h;dpr=ratio
            const grid=gridSize(width,height,cw,ch,limit)
            columns=grid.columns;rows=grid.rows;stepX=grid.cw;stepY=grid.ch
            let pw=Math.max(1,Math.floor(width*ratio))
            let ph=Math.max(1,Math.floor(height*ratio))
            pw=Math.min(maxDimension,pw)
            ph=Math.min(maxDimension,ph)
            while(pw*ph>maxPixels){
                if(pw>=ph) pw--
                else ph--
            }
            canvas.width=pw;canvas.height=ph
            ctx.setTransform(pw/Math.max(width,1),0,0,ph/Math.max(height,1),0,0)
            refresh()
        }
        const move=(event:PointerEvent)=>{
            if(!enabled||!visible||document.hidden||event.pointerType==="touch") return
            const rect=host.getBoundingClientRect()
            const x=event.clientX-rect.left,y=event.clientY-rect.top
            if(x<0||y<0||x>rect.width||y>rect.height){
                pointer.targetInfluence=0;start();return
            }
            pointer.targetX=x;pointer.targetY=y;pointer.targetInfluence=1
            if(pointer.influence===0){pointer.x=x;pointer.y=y}
            start()
        }
        const leave=()=>{pointer.targetInfluence=0;start()}
        const visibility=()=>{
            if(document.hidden) {pointer.influence=0;pointer.targetInfluence=0}
            refresh()
        }
        const blur=()=>{pointer.influence=0;pointer.targetInfluence=0;refresh()}
        const resizeObserver=typeof ResizeObserver==="undefined"?null:new ResizeObserver(resize)
        const intersectionObserver=typeof IntersectionObserver==="undefined"?null:new IntersectionObserver((entries)=>{
            const entry=entries[0]
            if(!entry) return
            if(visible!==entry.isIntersecting){
                visible=entry.isIntersecting
                if(!visible){pointer.influence=0;pointer.targetInfluence=0}
                refresh()
            }
        },{threshold:0})
        resizeObserver?.observe(host)
        intersectionObserver?.observe(host)
        window.addEventListener("resize",resize)
        window.addEventListener("blur",blur)
        document.addEventListener("visibilitychange",visibility)
        if(enabled){
            host.addEventListener("pointermove",move,{passive:true})
            host.addEventListener("pointerleave",leave)
            host.addEventListener("pointercancel",leave)
        }
        if(document.fonts){
            const request=`400 ${size}px ${props.fontFamily||"monospace"}`
            document.fonts.load(request).then(()=>{if(!disposed) draw()}).catch(()=>{})
            document.fonts.ready.then(()=>{if(!disposed) draw()}).catch(()=>{})
        }
        resize()
        return ()=>{
            disposed=true
            if(frame) cancelAnimationFrame(frame)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            window.removeEventListener("resize",resize)
            window.removeEventListener("blur",blur)
            document.removeEventListener("visibilitychange",visibility)
            host.removeEventListener("pointermove",move)
            host.removeEventListener("pointerleave",leave)
            host.removeEventListener("pointercancel",leave)
        }
    },[glyphs,props.speed,props.opacity,props.cellWidth,props.cellHeight,props.fontSize,props.fontFamily,
        props.terrainScale,props.contourSpacing,props.contourWidth,props.contrast,props.brightness,
        props.paused,props.frameRate,props.maxDpr,props.maxCells,props.cursorEnabled,
        props.cursorRadius,props.cursorStrength,props.cursorSmoothness,still])

    return <div ref={hostRef} style={{...props.style,width:"100%",height:"100%",minWidth:0,minHeight:0,position:"relative",overflow:"hidden",isolation:"isolate",backgroundColor:props.backgroundColor}}>
        <canvas ref={canvasRef} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",pointerEvents:"none"}} />
    </div>
}

KarimSaifCurrencySkyBackground.defaultProps={
    backgroundColor:"#0C0C0B",dimColor:"#1A1918",lowColor:"#2C2A28",midColor:"#524E4A",brightColor:"#959089",
    glyphPreset:"currency",customGlyphs:"·/$£",speed:.9,opacity:1,cellWidth:12,cellHeight:14,fontSize:12,
    fontFamily:"ui-monospace, monospace",terrainScale:.13,contourSpacing:.08,contourWidth:.12,contrast:1,
    brightness:1,paused:false,frameRate:30,maxDpr:2,maxCells:14000,cursorEnabled:true,
    cursorRadius:180,cursorStrength:1.5,cursorSmoothness:.12,
}

addPropertyControls(KarimSaifCurrencySkyBackground,{
    backgroundColor:{type:ControlType.Color,title:"Background",description:"Background color behind the flowing terrain."},
    glyphPreset:{type:ControlType.Enum,title:"Glyph Style",options:["currency","dollar","euro","pound","yen","crypto","symbols","binary","ascii","custom"],optionTitles:["Mixed Currency","Dollar","Euro","Pound","Yen","Bitcoin","Symbols","Binary","ASCII","Custom"],description:"Choose the characters used in the terrain."},
    customGlyphs:{type:ControlType.String,title:"Custom Glyphs",defaultValue:"·/$£",hidden:p=>p.glyphPreset!=="custom",description:"Four characters ordered from darkest to brightest."},
    dimColor:{type:ControlType.Color,title:"Dark Glyph",description:"Color for the faintest terrain glyphs."},
    lowColor:{type:ControlType.Color,title:"Low Glyph",description:"Color for low-intensity glyphs."},
    midColor:{type:ControlType.Color,title:"Mid Glyph",description:"Color for medium-intensity glyphs."},
    brightColor:{type:ControlType.Color,title:"Bright Glyph",description:"Color for the brightest contours."},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:5,step:.05,displayStepper:true,description:"Automatic terrain movement speed. Zero keeps the terrain still."},
    paused:{type:ControlType.Boolean,title:"Paused",enabledTitle:"Yes",disabledTitle:"No",description:"Pause animation and cursor interaction."},
    opacity:{type:ControlType.Number,title:"Opacity",min:0,max:1,step:.05,description:"Overall transparency of the currency glyphs."},
    cellWidth:{type:ControlType.Number,title:"Cell Width",min:4,max:40,step:1,unit:"px",description:"Horizontal glyph spacing."},
    cellHeight:{type:ControlType.Number,title:"Cell Height",min:4,max:40,step:1,unit:"px",description:"Vertical glyph spacing."},
    fontSize:{type:ControlType.Number,title:"Font Size",min:4,max:36,step:1,unit:"px",description:"Size of the characters."},
    fontFamily:{type:ControlType.String,title:"Font Family",description:"CSS font family used to render glyphs."},
    terrainScale:{type:ControlType.Number,title:"Terrain Scale",min:.01,max:.5,step:.005,description:"Scale and frequency of the terrain waves."},
    contourSpacing:{type:ControlType.Number,title:"Contours",min:.01,max:.3,step:.005,description:"Spacing of highlighted contour bands."},
    contourWidth:{type:ControlType.Number,title:"Band Width",min:.01,max:.45,step:.01,description:"Thickness of the highlighted bands."},
    contrast:{type:ControlType.Number,title:"Contrast",min:.2,max:3,step:.05,description:"Difference between dark and bright glyphs."},
    brightness:{type:ControlType.Number,title:"Brightness",min:.2,max:2,step:.05,description:"Overall terrain intensity."},
    cursorEnabled:{type:ControlType.Boolean,title:"Cursor Effect",enabledTitle:"On",disabledTitle:"Off",description:"Enable or disable cursor-reactive distortion."},
    cursorRadius:{type:ControlType.Number,title:"Cursor Radius",min:40,max:500,step:10,unit:"px",hidden:p=>!p.cursorEnabled,description:"Area affected by the cursor."},
    cursorStrength:{type:ControlType.Number,title:"Cursor Strength",min:0,max:5,step:.1,hidden:p=>!p.cursorEnabled,description:"How strongly the cursor bends the terrain."},
    cursorSmoothness:{type:ControlType.Number,title:"Cursor Smoothness",min:.01,max:1,step:.01,hidden:p=>!p.cursorEnabled,description:"How quickly the effect follows and settles."},
    frameRate:{type:ControlType.Number,title:"Frame Rate",min:10,max:60,step:5,description:"Target maximum canvas draw rate."},
    maxDpr:{type:ControlType.Number,title:"Pixel Ratio",min:1,max:2,step:.5,description:"Maximum canvas pixel density."},
    maxCells:{type:ControlType.Number,title:"Max Cells",min:1000,max:30000,step:1000,description:"Maximum number of glyph cells for performance."},
})
