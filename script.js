const SUPABASE_URL = "COLE_AQUI";
const SUPABASE_KEY = "COLE_AQUI";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let demandas = [];
let atalhoAtual = "todos";

const hojeISO = () => new Date().toISOString().slice(0,10);

function normalizar(texto){
  return (texto || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function entrar(){
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value.trim();
  const msg = document.getElementById("loginMsg");

  msg.textContent = "Entrando...";

  const { error } = await client.auth.signInWithPassword({ email, password: senha });

  if(error){
    msg.textContent = "Login inválido. Confira e-mail e senha.";
    return;
  }

  msg.textContent = "";
  iniciarApp();
}

async function sair(){
  await client.auth.signOut();
  location.reload();
}

async function verificarSessao(){
  const { data } = await client.auth.getSession();
  if(data.session){
    iniciarApp();
  }
}

function iniciarApp(){
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
  carregarDemandas();
}

function abrirFormulario(item = null){
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modalTitulo").textContent = item ? "Editar demanda" : "Nova demanda";

  document.getElementById("demandaId").value = item?.id || "";
  document.getElementById("titulo").value = item?.titulo || "";
  document.getElementById("descricao").value = item?.descricao || "";
  document.getElementById("setor").value = item?.setor || "";
  document.getElementById("responsavel").value = item?.responsavel || "";
  document.getElementById("prazo").value = item?.prazo || "";
  document.getElementById("prioridade").value = item?.prioridade || "importante";
  document.getElementById("status").value = item?.status || "pendente";
  document.getElementById("observacoes").value = item?.observacoes || "";
  document.getElementById("arquivo").value = "";
}

function fecharFormulario(){
  document.getElementById("modal").classList.add("hidden");
}

async function salvarDemanda(){
  const id = document.getElementById("demandaId").value;

  const payload = {
    titulo: document.getElementById("titulo").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),
    setor: document.getElementById("setor").value.trim(),
    responsavel: document.getElementById("responsavel").value.trim(),
    prazo: document.getElementById("prazo").value || null,
    prioridade: document.getElementById("prioridade").value,
    status: document.getElementById("status").value,
    observacoes: document.getElementById("observacoes").value.trim()
  };

  if(!payload.titulo){
    alert("Digite o título da demanda.");
    return;
  }

  let demandaId = id;

  if(id){
    const { error } = await client.from("demandas").update(payload).eq("id", id);
    if(error){ console.error(error); alert("Erro ao atualizar demanda."); return; }
  }else{
    const { data, error } = await client.from("demandas").insert([payload]).select().single();
    if(error){ console.error(error); alert("Erro ao salvar demanda."); return; }
    demandaId = data.id;
  }

  const arquivo = document.getElementById("arquivo").files[0];
  if(arquivo && demandaId){
    await enviarAnexo(demandaId, arquivo);
  }

  fecharFormulario();
  carregarDemandas();
}

async function enviarAnexo(demandaId, arquivo){
  const ext = arquivo.name.split(".").pop();
  const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const caminho = `${demandaId}/${Date.now()}-${nomeSeguro}`;

  const { error: upError } = await client.storage
    .from("anexos")
    .upload(caminho, arquivo, { upsert: true });

  if(upError){
    console.error(upError);
    alert("A demanda foi salva, mas o anexo não subiu. Confira o bucket/anexos no Supabase.");
    return;
  }

  const { data } = client.storage.from("anexos").getPublicUrl(caminho);

  await client.from("anexos_demanda").insert([{
    demanda_id: demandaId,
    nome_arquivo: arquivo.name,
    caminho,
    url_publica: data.publicUrl
  }]);
}

async function carregarDemandas(){
  const { data, error } = await client
    .from("demandas")
    .select("*, anexos_demanda(*)")
    .order("criado_em", { ascending:false });

  if(error){
    console.error(error);
    alert("Erro ao carregar demandas. Confira tabela e permissões.");
    return;
  }

  demandas = data || [];
  renderizar();
}

function estaAtrasada(item){
  return item.prazo && item.prazo < hojeISO() && !["concluido","arquivado"].includes(item.status);
}

function ehHoje(item){
  return item.prazo === hojeISO() && !["concluido","arquivado"].includes(item.status);
}

function calcularDashboard(){
  document.getElementById("countHoje").textContent = demandas.filter(ehHoje).length;
  document.getElementById("countUrgentes").textContent = demandas.filter(d => d.prioridade === "urgente" && d.status !== "concluido").length;
  document.getElementById("countAtrasadas").textContent = demandas.filter(estaAtrasada).length;
  document.getElementById("countConcluidas").textContent = demandas.filter(d => d.status === "concluido").length;
}

function aplicarAtalho(tipo){
  atalhoAtual = tipo;
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  event?.target?.classList.add("active");
  renderizar();
}

function passarFiltros(item){
  const busca = normalizar(document.getElementById("busca").value);
  const status = document.getElementById("filtroStatus").value;
  const prioridade = document.getElementById("filtroPrioridade").value;
  const responsavel = normalizar(document.getElementById("filtroResponsavel").value);

  const texto = normalizar(`${item.titulo} ${item.descricao} ${item.setor} ${item.responsavel} ${item.observacoes}`);

  if(busca && !texto.includes(busca)) return false;
  if(status && item.status !== status) return false;
  if(prioridade && item.prioridade !== prioridade) return false;
  if(responsavel && !normalizar(item.responsavel).includes(responsavel)) return false;

  if(atalhoAtual === "hoje" && !ehHoje(item)) return false;
  if(atalhoAtual === "urgentes" && item.prioridade !== "urgente") return false;
  if(atalhoAtual === "atrasadas" && !estaAtrasada(item)) return false;
  if(atalhoAtual === "aguardando" && item.status !== "aguardando") return false;
  if(atalhoAtual === "concluidas" && item.status !== "concluido") return false;

  return true;
}

function renderizar(){
  calcularDashboard();

  const lista = document.getElementById("listaDemandas");
  lista.innerHTML = "";

  const filtradas = demandas
    .filter(passarFiltros)
    .sort((a,b) => {
      const ax = estaAtrasada(a) ? 0 : 1;
      const bx = estaAtrasada(b) ? 0 : 1;
      if(ax !== bx) return ax - bx;
      const pa = a.prioridade === "urgente" ? 0 : a.prioridade === "importante" ? 1 : 2;
      const pb = b.prioridade === "urgente" ? 0 : b.prioridade === "importante" ? 1 : 2;
      return pa - pb;
    });

  if(!filtradas.length){
    lista.innerHTML = `<div class="empty">Nenhuma demanda encontrada.</div>`;
    return;
  }

  filtradas.forEach(item => {
    const atrasada = estaAtrasada(item);
    const anexos = item.anexos_demanda || [];

    const div = document.createElement("article");
    div.className = `demand-card ${atrasada ? "atrasada" : ""}`;

    div.innerHTML = `
      <div class="demand-top">
        <div>
          <h3>${item.titulo || "Sem título"}</h3>
          <p class="desc">${item.descricao || ""}</p>
        </div>
        <div class="actions">
          <button class="action" onclick='abrirFormulario(${JSON.stringify(item).replaceAll("'", "&#39;")})'>Editar</button>
          <button class="action ok" onclick="concluirDemanda(${item.id})">Concluir</button>
          <button class="action danger" onclick="excluirDemanda(${item.id})">Excluir</button>
        </div>
      </div>

      <div class="meta">
        ${atrasada ? `<span class="tag atrasada">ATRASADA</span>` : ""}
        <span class="tag ${item.prioridade}">${rotuloPrioridade(item.prioridade)}</span>
        <span class="tag ${item.status === "concluido" ? "concluido" : ""}">${rotuloStatus(item.status)}</span>
        <span class="tag">Responsável: ${item.responsavel || "não definido"}</span>
        <span class="tag">Setor: ${item.setor || "não informado"}</span>
        <span class="tag">Prazo: ${formatarData(item.prazo)}</span>
      </div>

      ${item.observacoes ? `<p class="desc"><strong>Obs.:</strong> ${item.observacoes}</p>` : ""}

      ${anexos.length ? `
        <div class="meta">
          ${anexos.map(a => `<a class="tag" href="${a.url_publica}" target="_blank">📎 ${a.nome_arquivo}</a>`).join("")}
        </div>
      ` : ""}
    `;

    lista.appendChild(div);
  });
}

function rotuloPrioridade(p){
  return p === "urgente" ? "🔴 Urgente" : p === "importante" ? "🟡 Importante" : "🔵 Depois";
}

function rotuloStatus(s){
  const mapa = {
    pendente:"Pendente",
    andamento:"Em andamento",
    aguardando:"Aguardando",
    concluido:"Concluído",
    arquivado:"Arquivado"
  };
  return mapa[s] || s || "Pendente";
}

function formatarData(data){
  if(!data) return "sem prazo";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function concluirDemanda(id){
  await client.from("demandas").update({status:"concluido"}).eq("id", id);
  carregarDemandas();
}

async function excluirDemanda(id){
  if(!confirm("Deseja excluir esta demanda?")) return;
  await client.from("demandas").delete().eq("id", id);
  carregarDemandas();
}

verificarSessao();
