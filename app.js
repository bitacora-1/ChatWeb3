// app.js - dependencia: ethers, WalletConnectProvider, firebase compat
(async () => {
  // ---- CONFIG FIREBASE: crea un proyecto en https://console.firebase.google.com/
  // y pega tu objeto firebaseConfig aquí (apiKey, authDomain, databaseURL, ...)
  const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
  };
  // ---- FIN CONFIG

  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // DOM
  const connectBtn = document.getElementById('connectBtn');
  const connectArea = document.getElementById('connectArea');
  const chatArea = document.getElementById('chatArea');
  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const addrShort = document.getElementById('addrShort');

  let provider = null;
  let signer = null;
  let userAddress = null;

  // Helpers
  function short(addr) {
    if(!addr) return '—';
    return addr.slice(0,6)+'...'+addr.slice(-4);
  }

  function showMessage(from, text, mine=false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg ' + (mine ? 'msg-right' : 'msg-left');
    wrapper.innerHTML = `<div class="who">${short(from)}</div><div class="text">${text}</div>`;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // WalletConnect provider options
  const WCProvider = window.WalletConnectProvider?.default || window.WalletConnectProvider;
  async function connect() {
    try {
      // Opción 1: si existe injected provider (Metamask)
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
      } else {
        // Opción 2: WalletConnect (QR) - requiere que agregues infuraId o rpc
        if(!WCProvider) throw new Error('WalletConnectProvider no disponible (CDN).');
        const wc = new WCProvider({
          rpc: { 1: 'https://cloudflare-eth.com' }, // usa RPC pública; para producción pon tu nodo/Infura
          qrcode: true
        });
        await wc.enable();
        provider = new ethers.providers.Web3Provider(wc, "any");
      }

      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      addrShort.textContent = short(userAddress);
      // mostrar chat
      connectArea.classList.add('hidden');
      chatArea.classList.remove('hidden');

      // Listen for chain/account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accs) => {
          if(accs.length===0) { location.reload(); return; }
          userAddress = accs[0];
          addrShort.textContent = short(userAddress);
        });
        window.ethereum.on('chainChanged', ()=>{ window.location.reload(); });
      }

      // start listening to firebase messages
      startListening();

    } catch (err) {
      console.error('Error connecting wallet', err);
      alert('Error conectando wallet: ' + (err.message || err));
    }
  }

  connectBtn.addEventListener('click', () => {
    connect();
  });

  // Chat: enviar mensaje a Firebase
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    const payload = {
      from: userAddress || 'anon',
      text,
      ts: Date.now()
    };
    // push a Realtime DB
    db.ref('messages').push(payload).catch(console.error);
    input.value = '';
  });

  // Escuchar mensajes en realtime
  function startListening() {
    const ref = db.ref('messages');
    ref.off();
    ref.limitToLast(200).on('child_added', snapshot => {
      const msg = snapshot.val();
      if(!msg) return;
      const mine = (msg.from && userAddress && msg.from.toLowerCase() === userAddress.toLowerCase());
      showMessage(msg.from || 'anon', msg.text || '', mine);
    });
  }

  // para debugging rápido:
  window.__appDebug = { connect, provider: () => provider, signer: () => signer };

})();
