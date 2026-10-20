"use client";
import {useEffect,useId,useRef} from 'react';
export function ConfirmationDialog({title,description,item,itemLanguage,cancelLabel,confirmLabel,onCancel,onConfirm}:{title:string;description:string;item?:string;itemLanguage?:'en'|'am';cancelLabel:string;confirmLabel:string;onCancel:()=>void;onConfirm:()=>void}){
 const id=useId();const titleId=id+'-title',itemId=id+'-item',descriptionId=id+'-description';
 const dialog=useRef<HTMLDialogElement>(null),cancelButton=useRef<HTMLButtonElement>(null),resolved=useRef(false);
 useEffect(()=>{const element=dialog.current!;element.showModal();cancelButton.current?.focus();return()=>{element.close();};},[]);
 function cancel(){resolved.current=true;onCancel();}
 return <dialog ref={dialog} className="editor-confirm-dialog" aria-labelledby={titleId} aria-describedby={[item?itemId:null,descriptionId].filter(Boolean).join(' ')} onCancel={e=>{e.preventDefault();cancel();}} onClose={()=>{if(!resolved.current&&dialog.current&&!dialog.current.open)cancel();}} onKeyDown={e=>{if(e.key!=='Tab')return;const buttons=dialog.current!.querySelectorAll<HTMLButtonElement>('button');const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}>
 <h2 id={titleId}>{title}</h2>{item?<p id={itemId} lang={itemLanguage} className="editor-confirm-item">{item}</p>:null}<p id={descriptionId}>{description}</p><div className="editor-dialog-actions"><button ref={cancelButton} type="button" className="button button-secondary" onClick={cancel}>{cancelLabel}</button><button type="button" className="button button-primary" onClick={()=>{resolved.current=true;onConfirm();}}>{confirmLabel}</button></div></dialog>;
}
