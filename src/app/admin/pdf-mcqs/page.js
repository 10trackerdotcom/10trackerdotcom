"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Bricolage+Grotesque:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:         #070810;
    --surface:    #0c0d18;
    --raised:     #10111e;
    --border:     #191b2e;
    --border-hi:  #252840;
    --accent:     #5b8dff;
    --accent-dim: #172050;
    --accent-g:   rgba(91,141,255,.10);
    --green:      #27c98f;
    --green-bg:   rgba(39,201,143,.07);
    --amber:      #f0a030;
    --amber-bg:   rgba(240,160,48,.07);
    --red:        #ff5566;
    --purple:     #a07aff;
    --cyan:       #22d4e8;
    --text:       #d8ddf2;
    --mid:        #7880a8;
    --dim:        #3e4260;
    --mono:       'IBM Plex Mono', monospace;
    --sans:       'Bricolage Grotesque', sans-serif;
  }
  html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:var(--sans);}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--border-hi);border-radius:2px}
  @keyframes spin   {to{transform:rotate(360deg)}}
  @keyframes fadeUp {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes blink  {0%,100%{opacity:.5}50%{opacity:1}}
  details>summary{list-style:none}details>summary::-webkit-details-marker{display:none}
`;

const BASE = "https://one0tracker-services.onrender.com/";

const COLORS = {
  accent:["rgba(91,141,255,.12)","#172050","#5b8dff"],
  green: ["rgba(39,201,143,.10)","rgba(39,201,143,.25)","#27c98f"],
  amber: ["rgba(240,160,48,.10)","rgba(240,160,48,.25)","#f0a030"],
  red:   ["rgba(255,85,102,.10)","rgba(255,85,102,.25)","#ff5566"],
  purple:["rgba(160,122,255,.10)","rgba(160,122,255,.25)","#a07aff"],
  cyan:  ["rgba(34,212,232,.10)","rgba(34,212,232,.25)","#22d4e8"],
  dim:   ["rgba(255,255,255,.04)","var(--border)","var(--mid)"],
};
const Tag = ({ label, color="dim", sm }) => {
  const [bg,bd,tx]=COLORS[color]||COLORS.dim;
  return <span style={{display:"inline-flex",alignItems:"center",padding:sm?"1px 5px":"2px 7px",borderRadius:3,fontSize:sm?9:10,fontFamily:"var(--mono)",letterSpacing:".05em",fontWeight:500,background:bg,border:`1px solid ${bd}`,color:tx,whiteSpace:"nowrap"}}>{label}</span>;
};
const Spin=()=><div style={{width:13,height:13,borderRadius:"50%",flexShrink:0,border:"2px solid var(--accent-dim)",borderTopColor:"var(--accent)",animation:"spin .55s linear infinite"}}/>;

const subC=s=>({Physics:"cyan",Chemistry:"amber",Maths:"green",Biology:"purple",History:"accent",Polity:"accent",Economy:"amber",GS:"dim",Other:"dim"}[s]||"dim");
const typC=t=>({simple:"dim",assertion_reason:"accent",match_list:"amber",statement_based:"green",chronological:"purple",numerical:"cyan"}[t]||"dim");

function ImgContent({content}){
  if(!content)return null;
  const items=Array.isArray(content)?content:[content];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
      {items.map((item,i)=>{
        if(!item)return null;
        if(typeof item==="string"&&item.trim().startsWith("<svg"))
          return <div key={i} style={{border:"1px solid var(--border-hi)",borderRadius:8,background:"#fff",padding:8,display:"inline-flex",maxWidth:220}}><div dangerouslySetInnerHTML={{__html:item}}/></div>;
        if(typeof item==="string"&&item.startsWith("{{IMAGE:"))
          return <div key={i} style={{border:"1px dashed var(--border-hi)",borderRadius:8,padding:"10px 14px",background:"var(--raised)",display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>🖼</span>
            <div>
              <div style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--dim)",letterSpacing:".06em",marginBottom:4}}>IMAGE PLACEHOLDER</div>
              <div style={{fontSize:12,color:"var(--mid)",lineHeight:1.6,fontStyle:"italic"}}>{item.replace(/^\{\{IMAGE:\s*/,"").replace(/\}\}$/,"").trim()}</div>
            </div>
          </div>;
        return null;
      })}
    </div>
  );
}

function QText({text,style}){
  if(!text?.includes("[IMAGE]"))return <span style={style}>{text}</span>;
  return <span style={style}>{text.split("[IMAGE]").map((p,i,a)=><span key={i}>{p}{i<a.length-1&&<span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 5px",borderRadius:4,margin:"0 3px",background:"var(--amber-bg)",border:"1px solid rgba(240,160,48,.3)",color:"var(--amber)",fontSize:10,fontFamily:"var(--mono)",verticalAlign:"middle"}}>🖼 fig</span>}</span>)}</span>;
}

// ── Output path pill ──────────────────────────────────────────────────────────
function OutputBanner({ outputPath, downloadUrl, outputId, totalMCQs }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      margin:"0 18px 10px", padding:"12px 13px", borderRadius:8,
      background:"rgba(39,201,143,.06)", border:"1px solid rgba(39,201,143,.25)",
      animation:"fadeUp .3s ease",
    }}>
      <div style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--green)",letterSpacing:".08em",marginBottom:8}}>
        ✓ JSON SAVED TO DISK
      </div>
      {/* Server path */}
      <div style={{
        fontFamily:"var(--mono)", fontSize:10, color:"var(--mid)",
        background:"var(--raised)", border:"1px solid var(--border)",
        borderRadius:6, padding:"6px 9px", marginBottom:8,
        wordBreak:"break-all", lineHeight:1.6,
      }}>
        📁 {outputPath || `./output/${outputId}.json`}
      </div>
      {/* Actions */}
      <div style={{display:"flex",gap:6}}>
        <a href={`${BASE}${downloadUrl}`} download style={{
          display:"inline-flex", alignItems:"center", gap:5,
          padding:"6px 12px", borderRadius:6, textDecoration:"none",
          background:"var(--green)", color:"#000",
          fontFamily:"var(--mono)", fontSize:11, fontWeight:600,
        }}>
          ↓ Download JSON ({totalMCQs} MCQs)
        </a>
        <button onClick={()=>{navigator.clipboard.writeText(`${BASE}${downloadUrl}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{
          padding:"6px 10px", borderRadius:6, border:"1px solid var(--border-hi)",
          background:"transparent", color:"var(--mid)", fontSize:10,
          fontFamily:"var(--mono)", cursor:"pointer",
        }}>{copied?"✓ copied":"copy link"}</button>
      </div>
    </div>
  );
}

// ── Saved outputs panel ───────────────────────────────────────────────────────
function SavedOutputs() {
  const [files, setFiles] = useState([]);
  const [open,  setOpen]  = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/api/outputs`);
      const d = await r.json();
      setFiles(d.files || []);
    } catch { }
  };

  useEffect(() => { load(); }, []);

  if (!open) return (
    <button onClick={() => { setOpen(true); load(); }} style={{
      margin:"0 18px 18px", padding:"8px 12px", borderRadius:7, width:"calc(100% - 36px)",
      border:"1px solid var(--border-hi)", background:"transparent",
      color:"var(--mid)", fontFamily:"var(--mono)", fontSize:10, cursor:"pointer",
    }}>
      📂 Previously saved outputs ({files.length})
    </button>
  );

  return (
    <div style={{margin:"0 18px 18px",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
      <div style={{
        padding:"8px 12px", background:"var(--raised)",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        borderBottom:"1px solid var(--border)",
      }}>
        <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--mid)"}}>SAVED OUTPUTS ({files.length})</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={load} style={{background:"none",border:"none",color:"var(--accent)",fontSize:10,fontFamily:"var(--mono)",cursor:"pointer"}}>↻ refresh</button>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"var(--dim)",fontSize:12,cursor:"pointer"}}>✕</button>
        </div>
      </div>
      <div style={{maxHeight:200,overflowY:"auto"}}>
        {files.length === 0 ? (
          <div style={{padding:"12px",fontSize:10,fontFamily:"var(--mono)",color:"var(--dim)",textAlign:"center"}}>No saved outputs yet</div>
        ) : files.map(f => (
          <div key={f.id} style={{
            padding:"8px 12px", borderBottom:"1px solid var(--border)",
            display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,
          }}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"var(--text)",fontFamily:"var(--mono)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {f.source_pdf||f.filename}
              </div>
              <div style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--mono)",marginTop:1}}>
                {f.total_mcqs} MCQs · {f.size_kb}KB · {f.extracted_at ? new Date(f.extracted_at).toLocaleDateString() : ""}
              </div>
            </div>
            <a href={`${BASE}${f.downloadUrl}`} download style={{
              padding:"3px 8px",borderRadius:5,textDecoration:"none",
              background:"var(--accent-g)",border:"1px solid var(--accent-dim)",
              color:"var(--accent)",fontSize:9,fontFamily:"var(--mono)",flexShrink:0,
            }}>↓</a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [file,    setFile]    = useState(null);
  const [drag,    setDrag]    = useState(false);
  const [logs,    setLogs]    = useState([]);
  const [mcqs,    setMcqs]    = useState([]);
  const [meta,    setMeta]    = useState(null);   // full done payload
  const [err,     setErr]     = useState(null);
  const [running, setRunning] = useState(false);
  const [selIdx,  setSelIdx]  = useState(null);
  const [filter,  setFilter]  = useState("ALL");
  const inputRef = useRef();

  const reset = f => { setFile(f);setLogs([]);setMcqs([]);setMeta(null);setErr(null);setSelIdx(null);setFilter("ALL"); };

  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if(f?.type==="application/pdf") reset(f);
  },[]);

  const extract = async () => {
    if(!file||running) return;
    setRunning(true);setLogs([]);setMcqs([]);setMeta(null);setErr(null);setSelIdx(null);setFilter("ALL");
    const form=new FormData(); form.append("pdf",file);
    try {
      const r=await fetch(`${BASE}/api/extract`,{method:"POST",body:form});
      const reader=r.body.getReader(); const dec=new TextDecoder(); let buf="";
      while(true){
        const{done,value}=await reader.read(); if(done) break;
        buf+=dec.decode(value,{stream:true});
        const evts=buf.split("\n\n"); buf=evts.pop()||"";
        for(const raw of evts){
          if(!raw.trim()) continue;
          const eL=raw.split("\n").find(l=>l.startsWith("event:"));
          const dL=raw.split("\n").find(l=>l.startsWith("data:"));
          if(!eL||!dL) continue;
          const event=eL.replace("event:","").trim();
          const data=JSON.parse(dL.replace("data:","").trim());
          if(event==="status") setLogs(p=>[...p,data.message]);
          if(event==="error")  { setErr(data.message); setRunning(false); }
          if(event==="done")   { setMcqs(data.mcqs); setMeta(data); setRunning(false); setLogs(p=>[...p,`✓ Saved → ${data.outputPath||data.outputId+".json"}`]); }
        }
      }
    } catch(e){ setErr(e.message); setRunning(false); }
  };

  const subjects = meta ? Object.keys(meta.by_subject||{}) : [];
  const filtered = filter==="ALL" ? mcqs : mcqs.filter(q=>q.subject===filter);
  const sel = selIdx!==null ? mcqs[selIdx] : null;

  return (
    <>
      <style>{css}</style>
      {/* Header */}
      <header style={{borderBottom:"1px solid var(--border)",background:"var(--surface)",padding:"11px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,borderRadius:5,border:"1px solid var(--accent-dim)",background:"var(--accent-g)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,letterSpacing:"-.03em"}}>MCQ Extractor</div>
            <div style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--mono)"}}>Files API · gpt-4o-mini · saves JSON to ./output/</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <Tag label="Files API" color="accent"/>
          <Tag label="$0.15/M in" color="dim"/>
          <Tag label="$0.60/M out" color="dim"/>
          <Tag label="SVG+{{IMAGE}}" color="amber"/>
        </div>
      </header>

      <div style={{display:"grid",gridTemplateColumns:mcqs.length>0?"340px 1fr":"1fr",height:"calc(100vh - 51px)"}}>

        {/* ── LEFT ── */}
        <div style={{borderRight:mcqs.length>0?"1px solid var(--border)":"none",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:16}}>
            {/* Drop zone */}
            <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
              onClick={()=>!running&&inputRef.current.click()}
              style={{border:`2px dashed ${drag?"var(--accent)":file?"var(--accent-dim)":"var(--border-hi)"}`,borderRadius:9,padding:"20px 14px",textAlign:"center",cursor:running?"not-allowed":"pointer",background:drag?"var(--accent-g)":"var(--surface)",transition:"all .15s",animation:running?"blink 2s ease infinite":"none"}}>
              <input ref={inputRef} type="file" accept=".pdf" hidden onChange={e=>e.target.files[0]&&reset(e.target.files[0])}/>
              <div style={{fontSize:24,marginBottom:4}}>{file?"📄":"📂"}</div>
              {file
                ? <><div style={{fontWeight:700,fontSize:12,color:"var(--accent)"}}>{file.name}</div><div style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--dim)",marginTop:2}}>{(file.size/1024).toFixed(0)} KB</div></>
                : <><div style={{fontWeight:600,fontSize:12}}>Drop PDF here</div><div style={{fontSize:10,color:"var(--dim)",marginTop:2}}>or click to browse · max 50 MB</div></>
              }
            </div>

            {/* Button */}
            <button onClick={extract} disabled={!file||running} style={{width:"100%",marginTop:8,padding:"10px 0",borderRadius:7,border:"none",cursor:file&&!running?"pointer":"not-allowed",fontFamily:"var(--sans)",fontWeight:700,fontSize:12,background:file&&!running?"linear-gradient(135deg,#5b8dff,#3660d8)":"var(--border)",color:file&&!running?"#fff":"var(--dim)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {running?<><Spin/>Extracting...</>:"⚡ Extract MCQs"}
            </button>

            {/* How it works */}
            <div style={{marginTop:7,padding:"8px 10px",borderRadius:6,background:"var(--raised)",border:"1px solid var(--border)",fontSize:9,fontFamily:"var(--mono)",color:"var(--dim)",lineHeight:1.9}}>
              PDF → Files API (file_id) → gpt-4o-mini<br/>
              model sees: text + page images<br/>
              JSON saved → <span style={{color:"var(--green)"}}>./output/&lt;name&gt;_&lt;ts&gt;.json</span><br/>
              download via <span style={{color:"var(--accent)"}}>/api/download/:id</span>
            </div>
          </div>

          {/* Logs */}
          {logs.length>0&&(
            <div style={{margin:"0 16px 9px",padding:"8px 10px",borderRadius:7,background:"var(--raised)",border:"1px solid var(--border)",maxHeight:130,overflowY:"auto",fontSize:10,fontFamily:"var(--mono)",lineHeight:1.9}}>
              {logs.map((l,i)=><div key={i} style={{color:l.startsWith("✓")?"var(--green)":l.startsWith("⚠")?"var(--amber)":"var(--mid)",display:"flex",gap:5,animation:"fadeUp .2s ease"}}><span style={{color:"var(--dim)"}}>›</span>{l}</div>)}
            </div>
          )}

          {/* Error */}
          {err&&<div style={{margin:"0 16px 9px",padding:"9px 11px",borderRadius:7,background:"rgba(255,85,102,.07)",border:"1px solid rgba(255,85,102,.25)",color:"var(--red)",fontSize:11,fontFamily:"var(--mono)"}}>⚠ {err}</div>}

          {/* ── OUTPUT BANNER — shown after extraction ── */}
          {meta&&(
            <OutputBanner
              outputPath={meta.outputPath}
              downloadUrl={meta.downloadUrl}
              outputId={meta.outputId}
              totalMCQs={meta.total_mcqs}
            />
          )}

          {/* Cost + subject stats */}
          {meta&&(
            <div style={{margin:"0 16px 9px",padding:"11px 12px",borderRadius:7,background:"var(--green-bg)",border:"1px solid rgba(39,201,143,.18)"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",marginBottom:8}}>
                {[["MCQs",meta.total_mcqs],["With image",meta.with_images],["In tokens",meta.tokens?.input?.toLocaleString()],["Out tokens",meta.tokens?.output?.toLocaleString()],["USD",`$${meta.cost?.usd}`],["INR",`₹${meta.cost?.inr}`]].map(([k,v])=>(
                  <div key={k}><div style={{fontSize:8,color:"var(--dim)",fontFamily:"var(--mono)",letterSpacing:".06em"}}>{k}</div><div style={{fontSize:12,fontWeight:700,fontFamily:"var(--mono)"}}>{v}</div></div>
                ))}
              </div>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {subjects.map(s=><Tag key={s} label={`${s} ${meta.by_subject[s]}`} color={subC(s)} sm/>)}
              </div>
            </div>
          )}

          {/* Subject filter */}
          {mcqs.length>0&&(
            <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"0 16px 5px",display:"flex",gap:3,flexWrap:"wrap"}}>
                {["ALL",...subjects].map(s=>(
                  <button key={s} onClick={()=>{setFilter(s);setSelIdx(null);}} style={{padding:"2px 7px",borderRadius:4,border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontSize:9,fontWeight:600,background:filter===s?"var(--accent-dim)":"var(--border)",color:filter===s?"var(--accent)":"var(--dim)"}}>
                    {s}{s!=="ALL"&&` ${meta?.by_subject?.[s]}`}
                  </button>
                ))}
              </div>
              <div style={{padding:"0 16px 5px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--dim)"}}>{filtered.length} questions</span>
                <a href={`${BASE}${meta?.downloadUrl}`} download style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--accent)",textDecoration:"none",border:"1px solid var(--accent-dim)",padding:"2px 7px",borderRadius:4,background:"var(--accent-g)"}}>↓ download all</a>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
                {filtered.map((q,i)=>{
                  const ri=mcqs.indexOf(q);
                  return(
                    <div key={ri} onClick={()=>setSelIdx(ri===selIdx?null:ri)}
                      style={{padding:"7px 9px",borderRadius:6,marginBottom:4,cursor:"pointer",border:`1px solid ${selIdx===ri?"var(--accent-dim)":"var(--border)"}`,background:selIdx===ri?"var(--accent-g)":"var(--surface)",transition:"all .12s",animation:"fadeUp .2s ease both",animationDelay:`${Math.min(i*.012,.3)}s`}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:4,marginBottom:3}}>
                        <span style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--dim)",flexShrink:0}}>#{String(ri+1).padStart(3,"0")}</span>
                        <div style={{display:"flex",gap:2}}>{q.has_image&&<Tag label="🖼" color="amber" sm/>}<Tag label={q.subject||"Other"} color={subC(q.subject)} sm/><Tag label={q.type||"simple"} color={typC(q.type)} sm/></div>
                      </div>
                      <QText text={q.question} style={{fontSize:11,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}/>
                      {q.source&&<div style={{marginTop:2,fontSize:8,fontFamily:"var(--mono)",color:"var(--dim)"}}>[{q.source}]</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Previously saved outputs */}
          {!running && <SavedOutputs />}
        </div>

        {/* ── RIGHT ── */}
        {mcqs.length>0&&(
          <div style={{overflow:"auto",padding:26}}>
            {sel?(
              <div style={{maxWidth:680,animation:"fadeUp .2s ease"}}>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
                  <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--dim)"}}>#{String(selIdx+1).padStart(3,"0")}</span>
                  <Tag label={sel.subject||"Other"} color={subC(sel.subject)}/>
                  <Tag label={sel.type||"simple"} color={typC(sel.type)}/>
                  {sel.has_image&&<Tag label="has image" color="amber"/>}
                  {sel.source&&<Tag label={sel.source} color="dim"/>}
                </div>
                <div style={{fontSize:15,fontWeight:600,lineHeight:1.75,marginBottom:8}}><QText text={sel.question}/></div>
                {sel.has_image&&<ImgContent content={sel.image_content}/>}
                <div style={{display:"flex",flexDirection:"column",gap:7,margin:"18px 0 22px"}}>
                  {Object.entries(sel.options||{}).map(([k,v])=>{
                    const ok=k===sel.correct;
                    return(
                      <div key={k} style={{padding:"9px 12px",borderRadius:8,display:"flex",gap:9,alignItems:"flex-start",border:`1px solid ${ok?"rgba(39,201,143,.35)":"var(--border)"}`,background:ok?"var(--green-bg)":"var(--surface)"}}>
                        <span style={{width:19,height:19,borderRadius:4,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,fontFamily:"var(--mono)",background:ok?"rgba(39,201,143,.2)":"var(--border)",color:ok?"var(--green)":"var(--mid)",border:ok?"1px solid rgba(39,201,143,.4)":"none"}}>{k.toUpperCase()}</span>
                        <span style={{fontSize:12.5,lineHeight:1.65,flex:1,color:ok?"var(--text)":"var(--mid)"}}><QText text={v}/></span>
                        {ok&&<span style={{color:"var(--green)",fontSize:10,flexShrink:0,marginTop:1}}>✓</span>}
                      </div>
                    );
                  })}
                </div>
                <details style={{borderRadius:8,overflow:"hidden",border:"1px solid var(--border)"}}>
                  <summary style={{padding:"7px 12px",background:"var(--raised)",cursor:"pointer",fontSize:10,fontFamily:"var(--mono)",color:"var(--dim)",letterSpacing:".06em",display:"flex",justifyContent:"space-between"}}>
                    <span>RAW JSON</span>
                    <span style={{color:"var(--accent)",cursor:"pointer"}} onClick={e=>{e.preventDefault();navigator.clipboard.writeText(JSON.stringify(sel,null,2));}}>copy</span>
                  </summary>
                  <pre style={{padding:12,margin:0,background:"#060710",fontFamily:"var(--mono)",fontSize:10,lineHeight:1.75,color:"var(--mid)",overflowX:"auto",maxHeight:360}}>{JSON.stringify(sel,null,2)}</pre>
                </details>
              </div>
            ):(
              <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--dim)",gap:10}}>
                <div style={{fontSize:32}}>←</div>
                <div style={{fontFamily:"var(--mono)",fontSize:12}}>Select a question to inspect</div>
                <div style={{fontSize:11,color:"var(--dim)"}}>{mcqs.length} total · {meta?.with_images||0} with images</div>
                {meta?.downloadUrl&&(
                  <a href={`${BASE}${meta.downloadUrl}`} download style={{marginTop:8,padding:"8px 16px",borderRadius:7,textDecoration:"none",background:"var(--green)",color:"#000",fontFamily:"var(--mono)",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                    ↓ Download full JSON ({mcqs.length} MCQs)
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {mcqs.length===0&&!running&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,gap:14,color:"var(--dim)"}}>
            <div style={{fontSize:42}}>📋</div>
            <div style={{fontWeight:800,fontSize:19,color:"var(--mid)"}}>Drop a PDF to extract MCQs</div>
            <div style={{fontSize:11,fontFamily:"var(--mono)",textAlign:"center",lineHeight:2}}>
              JSON saved to <span style={{color:"var(--green)"}}>./output/</span> on the server<br/>
              Download via browser or <span style={{color:"var(--accent)"}}>GET /api/download/:id</span><br/>
              Works for GS + STEM · SVG diagrams · {'{{IMAGE}}'} placeholders
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>
              {["Physics","Chemistry","Maths","Biology","History","Polity","GS"].map(s=><Tag key={s} label={s} color={subC(s)}/>)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}