/* ...existing code... */

/* app.js - Web3 connect + simple local chat using connected address as username */

import WalletConnectProvider from "WalletConnectProvider";
import Web3Modal from "Web3Modal";
import { ethers } from "ethers";

const connectBtn = document.getElementById('connectBtn');
const connectContainer = document.getElementById('connectContainer');
const chatContainer = document.getElementById('chatContainer');
const addressBadge = document.getElementById('addressBadge');
const messagesEl = document.getElementById('messages');
const composer = document.getElementById('composer');
const msgInput = document.getElementById('msgInput');

let web3Modal;
let provider;
let signer;
let userAddress;

/* Initialize Web3Modal with WalletConnect provider option */
function initWeb3Modal(){
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1" // public demo placeholder; recommend project-specific key in production
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions
  });
}

/* Utility: shorten address */
function shortAddr(addr){
  if(!addr) return '';
  return addr.slice(0,6) + '...' + addr.slice(-4);
}

/* Fade helpers */
function fadeOut(el, cb){
  el.classList.remove('fade-in');
  el.classList.add('fade-out');
  setTimeout(()=>{ el.classList.add('hidden'); el.classList.remove('fade-out'); if(cb) cb(); }, 360);
}
function fadeIn(el){
  el.classList.remove('hidden');
  el.classList.add('fade-in');
  setTimeout(()=>el.classList.remove('fade-in'), 380);
}

/* Connect wallet flow */
async function connectWallet(){
  try{
    const externalProvider = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(externalProvider);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // show address
    addressBadge.textContent = shortAddr(userAddress);
    addressBadge.title = userAddress;
    addressBadge.classList.remove('hidden');

    // hide connect, show chat
    fadeOut(connectContainer, ()=> {
      connectContainer.style.display = 'none';
      chatContainer.classList.remove('hidden');
      fadeIn(chatContainer);
      msgInput.focus();
    });

    // handle account changes
    externalProvider.on && externalProvider.on('accountsChanged', async (accounts) => {
      if(accounts && accounts.length){
        userAddress = accounts[0];
        addressBadge.textContent = shortAddr(userAddress);
        addressBadge.title = userAddress;
      } else {
        // disconnected
        resetUI();
      }
    });

    externalProvider.on && externalProvider.on('disconnect', ()=> resetUI());

    // greet
    addSystemMessage(`Conectado como ${shortAddr(userAddress)}`);
  }catch(err){
    console.error('connect error', err);
  }
}

function resetUI(){
  // simple reset: reload to clear provider caches
  window.location.reload();
}

/* Messaging (local, in-memory) */
function createMessageElement({address, text, isMe=false}){
  const el = document.createElement('div');
  el.className = 'msg ' + (isMe ? 'me' : 'other');
  el.innerHTML = `<span class="addr">${address}</span><span class="text">${escapeHtml(text)}</span>`;
  return el;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
}

function addSystemMessage(text){
  const wrapper = document.createElement('div');
  wrapper.className = 'msg other show';
  wrapper.style.background = 'transparent';
  wrapper.style.boxShadow = 'none';
  wrapper.style.color = 'var(--muted)';
  wrapper.textContent = text;
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* Add a message to the UI */
function pushMessage(address, text, isMe=false){
  const msgEl = createMessageElement({address, text, isMe});
  messagesEl.appendChild(msgEl);
  // small timeout for enter animation
  setTimeout(()=> msgEl.classList.add('show'), 8);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* Hook events */
connectBtn.addEventListener('click', async ()=> {
  await connectWallet();
});

composer.addEventListener('submit', (e)=>{
  e.preventDefault();
  const text = msgInput.value.trim();
  if(!text) return;
  pushMessage(userAddress, text, true);
  msgInput.value = '';
  msgInput.focus();

  // Simulate a reply from another address for demo purposes (delayed)
  setTimeout(()=> {
    const other = '0x' + Math.random().toString(16).slice(2,10) + '...'+Math.random().toString(16).slice(2,6);
    pushMessage(other, "Echo: " + text, false);
  }, 800);
});

/* Initialize */
initWeb3Modal();

/* ...existing code... */

