const SUPABASE_URL = "https://qiebxdlccwayzhyhlxee.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZWJ4ZGxjY3dheXpoeWhseGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDAxODgsImV4cCI6MjA5NTE3NjE4OH0.in1dcIkaLCXWj0QwE148tqGiq_puKMHbcvX2TPkIEC4";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let demandas = [];
let atalhoAtual = "todos";
const hojeISO = () => new Date().toISOString().slice(0, 10);

function normalizar(texto) {
  return (texto || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function entrar() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value.trim();
  const msg = document.getElementById("loginMsg");
  if (msg) msg.textContent = "Entrando...";
  const { error } = await client.auth.signInWithPassword({ email, password: senha });
  if (error) {
    if (msg) msg.textContent = "Login inválido. Confira e-mail e senha.";
    return;
  }
  if (msg) msg.textContent = "";
  iniciarSistema();
}

async function sair() {
  await client.auth.signOut();
  location.reload();
}

async function verificarLogin() {
  const { data } = await client.auth.getSession();
  if (data.session) iniciarSistema();
  else {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("appScreen").classList.add("hidden");
  }
}

function iniciarSistema() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
  carregarDemandas();
}

async function carregarDemandas() {
  const { data, error } = await client.from("demandas").select("*").order("id", { ascending: false });
  if (error) {
    console.log(error);
    alert("Erro ao carregar demandas.");
    return;
  }
  demandas = data || [];
  renderizar();
}

function abrirFormulario(item = null) {
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
}

function fecharFormulario() {
  document.getElementById("modal").classList.add("hidden");
}

async function salvarDemanda() {
  const btnSalvar = document.getElementById("btnSalvar");
  btnSalvar.disabled = true;
  btnSalvar.textContent = "Salvando...";
  const demandaId = document.getElementById("demandaId").value;
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
  if (!payload.titulo) {
    alert("Digite o título da demanda.");
    btnSalvar.disabled = false;
    btnSalvar.textContent = "Salvar demanda";
    return;
  }
  let resposta;
  if (demandaId) resposta = await client.from("demandas").update(payload).eq("id", demandaId);
  else resposta = await client.from("demandas").insert([payload]);
  if (resposta.error) {
    console.log(resposta.error);
    alert("Erro ao salvar demanda.");
    btnSalvar.disabled = false;
    btnSalvar.textContent = "Salvar demanda";
    return;
  }
  btnSalvar.disabled = false;
  btnSalvar.textContent = "Salvar demanda";
  fecharFormulario();
  carregarDemandas();
}

function estaAtrasada(item) {
  return item.prazo && item.prazo < hojeISO() && item.status !== "arquivado";
}

function ehHoje(item) {
  return item.prazo === hojeISO() && item.status !== "arquivado";
}

function aplicarAtalho(tipo, botao) {
  atalhoAtual = tipo;
  document.querySelectorAll(".nav").forEach(btn => btn.classList.remove("active"));
  if (botao) botao.classList.add("active");
  renderizar();
}

function renderizar() {
  const lista = document.getElementById("listaDemandas");
  lista.innerHTML = "";
  const busca = normalizar(document.getElementById("busca").value);
  const filtroStatus = document.getElementById("filtroStatus").value;
  const filtroPrioridade = document.getElementById("filtroPrioridade").value;
  const filtroResponsavel = normalizar(document.getElementById("filtroResponsavel").value);
  const filtradas = demandas.filter(item => {
    const texto = normalizar(`${item.titulo} ${item.descricao} ${item.setor} ${item.responsavel} ${item.observacoes}`);
    if (busca && !texto.includes(busca)) return false;
    if (filtroStatus && item.status !== filtroStatus) return false;
    if (filtroPrioridade && item.prioridade !== filtroPrioridade) return false;
    if (filtroResponsavel && !normalizar(item.responsavel).includes(filtroResponsavel)) return false;
    if (atalhoAtual === "hoje" && !ehHoje(item)) return false;
    if (atalhoAtual === "urgentes" && item.prioridade !== "urgente") return false;
    if (atalhoAtual === "atrasadas" && !estaAtrasada(item)) return false;
    if (atalhoAtual === "aguardando" && item.status !== "aguardando") return false;
    if (atalhoAtual === "arquivadas" && item.status !== "arquivado") return false;
    return true;
  });

  let hoje = 0, urgentes = 0, atrasadas = 0, arquivadas = 0;
  demandas.forEach(item => {
    if (ehHoje(item)) hoje++;
    if (item.prioridade === "urgente" && item.status !== "arquivado") urgentes++;
    if (estaAtrasada(item)) atrasadas++;
    if (item.status === "arquivado") arquivadas++;
  });

  const ordenadas = filtradas.sort((a, b) => {
    const aAtrasada = estaAtrasada(a) ? 0 : 1;
    const bAtrasada = estaAtrasada(b) ? 0 : 1;
    if (aAtrasada !== bAtrasada) return aAtrasada - bAtrasada;
    const prioridades = { urgente: 0, importante: 1, depois: 2 };
    return (prioridades[a.prioridade] ?? 3) - (prioridades[b.prioridade] ?? 3);
  });

  if (!ordenadas.length) lista.innerHTML = `<div class="empty">Nenhuma demanda encontrada.</div>`;

  ordenadas.forEach(item => {
    const div = document.createElement("article");
    div.className = estaAtrasada(item) ? "demand-card atrasada" : "demand-card";
    div.innerHTML = `
      <div class="demand-top"><div><h3>${item.titulo || "Sem título"}</h3><p class="desc">${item.descricao || ""}</p></div></div>
      <div class="meta">
        ${estaAtrasada(item) ? `<span class="tag atrasada">🚨 ATRASADA</span>` : ""}
        ${ehHoje(item) ? `<span class="tag hoje">⚠️ HOJE</span>` : ""}
        <span class="tag ${item.prioridade || ""}">${rotuloPrioridade(item.prioridade)}</span>
        <span class="tag ${item.status === "arquivado" ? "concluido" : ""}">${rotuloStatus(item.status)}</span>
        <span class="tag">Responsável: ${item.responsavel || "não definido"}</span>
        <span class="tag">Setor: ${item.setor || "não informado"}</span>
        <span class="tag">Prazo: ${formatarData(item.prazo)}</span>
      </div>
      ${item.observacoes ? `<p class="desc"><strong>Obs.:</strong> ${item.observacoes}</p>` : ""}
      <div class="actions">
        <button class="action" onclick='abrirFormulario(${JSON.stringify(item).replaceAll("'", "&#39;")})'>Editar</button>
        <button class="action ok" onclick="concluirDemanda(${item.id})">Arquivar</button>
        <button class="action danger" onclick="excluirDemanda(${item.id})">Excluir</button>
      </div>`;
    lista.appendChild(div);
  });

  document.getElementById("countHoje").innerText = hoje;
  document.getElementById("countUrgentes").innerText = urgentes;
  document.getElementById("countAtrasadas").innerText = atrasadas;
  document.getElementById("countArquivadas").innerText = arquivadas;
}

function rotuloPrioridade(prioridade) {
  if (prioridade === "urgente") return "🔴 Urgente";
  if (prioridade === "importante") return "🟡 Importante";
  if (prioridade === "depois") return "🔵 Depois";
  return prioridade || "Sem prioridade";
}

function rotuloStatus(status) {
  const mapa = { pendente: "Pendente", andamento: "Em andamento", aguardando: "Aguardando", arquivado: "Arquivado" };
  return mapa[status] || status || "Pendente";
}

function formatarData(data) {
  if (!data) return "sem prazo";
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

async function concluirDemanda(id) {
  const { error } = await client.from("demandas").update({ status: "arquivado" }).eq("id", id);
  if (error) {
    console.log(error);
    alert("Erro ao arquivar demanda.");
    return;
  }
  carregarDemandas();
}

async function excluirDemanda(id) {
  const confirmar = confirm("Deseja excluir esta demanda?");
  if (!confirmar) return;
  const { error } = await client.from("demandas").delete().eq("id", id);
  if (error) {
    console.log(error);
    alert("Erro ao excluir demanda.");
    return;
  }
  carregarDemandas();
}

verificarLogin();
