"use client";
import {useEffect,useRef,useState} from 'react';
type NavigationRequest={resume:()=>void;trigger:HTMLElement|null};
/** Styled in-app confirmation; browser unload retains the native safety warning. */
export function useUnsavedTeaching(dirty:boolean) {
 const dirtyRef=useRef(dirty),armed=useRef(false),bypass=useRef(false),resetTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const pendingRequest=useRef<NavigationRequest|null>(null);
 const [navigationRequest,setNavigationRequest]=useState<NavigationRequest|null>(null);
 useEffect(()=>{dirtyRef.current=dirty;},[dirty]);
 useEffect(()=>{
  if(dirty&&!armed.current){history.pushState({...history.state,oatEditorGuard:true},'',location.href);armed.current=true;}
 },[dirty]);
 useEffect(()=>{
  const request=(resume:()=>void,trigger:HTMLElement|null)=>{if(pendingRequest.current)return;const next={resume,trigger};pendingRequest.current=next;setNavigationRequest(next);};
  const unload=(e:BeforeUnloadEvent)=>{if(dirtyRef.current&&!bypass.current){e.preventDefault();e.returnValue='';}};
  const click=(e:MouseEvent)=>{
   if(!dirtyRef.current||bypass.current||e.defaultPrevented||e.button!==0)return;
   const element=e.target instanceof Element?e.target.closest('a,button[data-admin-signout]'):null;
   if(!(element instanceof HTMLElement))return;
   if(element instanceof HTMLAnchorElement){
    if(element.target==='_blank'||element.hasAttribute('download')||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const url=new URL(element.href);if(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search)return;
   }
   e.preventDefault();e.stopPropagation();
   request(()=>{if(element.isConnected)element.click();},element);
  };
  const pop=()=>{
   if(!armed.current)return;
   armed.current=false;
   if(dirtyRef.current&&!bypass.current){
    // Restore the guard while the asynchronous dialog is open; Cancel stays put.
    history.pushState({...history.state,oatEditorGuard:true},'',location.href);armed.current=true;
    request(()=>{armed.current=false;history.go(-2);},document.activeElement instanceof HTMLElement?document.activeElement:null);
   }else history.back();
  };
  window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);window.addEventListener('popstate',pop);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);window.removeEventListener('popstate',pop);if(resetTimer.current)clearTimeout(resetTimer.current);};
 },[]);
 function cancelNavigation(){const trigger=pendingRequest.current?.trigger;pendingRequest.current=null;setNavigationRequest(null);requestAnimationFrame(()=>{if(trigger?.isConnected)trigger.focus();});}
 function confirmNavigation(){
  const request=pendingRequest.current;if(!request)return;
  pendingRequest.current=null;setNavigationRequest(null);bypass.current=true;
  // Allow precisely the confirmed navigation, then re-arm if it fails or stays on-page.
  if(resetTimer.current)clearTimeout(resetTimer.current);
  resetTimer.current=setTimeout(()=>{bypass.current=false;},1000);
  requestAnimationFrame(()=>request.resume());
 }
 return {releaseGuard:()=>{dirtyRef.current=false;},navigationRequest,cancelNavigation,confirmNavigation};
}
