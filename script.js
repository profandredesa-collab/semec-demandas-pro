const SUPABASE_URL = "https://qiebxdlccwayzhyhlxee.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZWJ4ZGxjY3dheXpoeWhseGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDAxODgsImV4cCI6MjA5NTE3NjE4OH0.in1dcIkaLCXWj0QwE148tqGiq_puKMHbcvX2TPkIEC4";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let demandas = [];
let atalhoAtual = "todos";

const hojeISO = () => new Date().toISOString().slice(0,10);

function normalizar(texto){

  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}

async function carregarDemandas(){

  const { data, error } = await client
    .from("demandas")
    .select("*")
    .order("id", { ascending:false });

  if(error){

    console.log(error);

    alert("Erro ao carregar demandas");

    return;
  }

  demandas = data || [];

  renderizar();
}

function abrirFormulario(){

  document
    .getElementById("modal")
    .classList
    .remove("hidden");

}

function fecharFormulario(){

  document
    .getElementById("modal")
    .classList
    .add("hidden");

}

async function salvarDemanda(){

  const btnSalvar =
    document.getElementById("btnSalvar");

  btnSalvar.disabled = true;

  btnSalvar.textContent = "Salvando...";

  const payload = {

    titulo:
      document.getElementById("titulo").value,

    descricao:
      document.getElementById("descricao").value,

    responsavel:
      document.getElementById("responsavel").value,

    prazo:
      document.getElementById("prazo").value,

    prioridade:
      document.getElementById("prioridade").value,

    status:
      document.getElementById("status").value

  };

  const { error } = await client
    .from("demandas")
    .insert([payload]);

  if(error){

    console.log(error);

    alert("Erro ao salvar");

    btnSalvar.disabled = false;

    btnSalvar.textContent = "Salvar demanda";

    return;
  }

  btnSalvar.disabled = false;

  btnSalvar.textContent = "Salvar demanda";

  fecharFormulario();

  carregarDemandas();
}

function estaAtrasada(item){

  return item.prazo &&
         item.prazo < hojeISO() &&
         item.status !== "arquivado";

}

function ehHoje(item){

  return item.prazo === hojeISO() &&
         item.status !== "arquivado";

}

function aplicarAtalho(tipo){

  atalhoAtual = tipo;

  renderizar();
}

function renderizar(){

  const lista =
    document.getElementById("listaDemandas");

  lista.innerHTML = "";

  const busca = normalizar(
    document.getElementById("busca").value
  );

  const filtradas = demandas.filter(item => {

    const texto = normalizar(
      `${item.titulo} ${item.descricao} ${item.responsavel}`
    );

    if(busca && !texto.includes(busca)){
      return false;
    }

    if(
      atalhoAtual === "urgentes" &&
      item.prioridade !== "urgente"
    ){
      return false;
    }

    if(
      atalhoAtual === "hoje" &&
      !ehHoje(item)
    ){
      return false;
    }

    if(
      atalhoAtual === "atrasadas" &&
      !estaAtrasada(item)
    ){
      return false;
    }

    if(
      atalhoAtual === "arquivadas" &&
      item.status !== "arquivado"
    ){
      return false;
    }

    return true;

  });

  let hoje = 0;
  let urgentes = 0;
  let atrasadas = 0;
  let arquivadas = 0;

  filtradas.forEach(item => {

    if(ehHoje(item)){
      hoje++;
    }

    if(item.prioridade === "urgente"){
      urgentes++;
    }

    if(estaAtrasada(item)){
      atrasadas++;
    }

    if(item.status === "arquivado"){
      arquivadas++;
    }

    const div = document.createElement("div");

    div.className = estaAtrasada(item)
      ? "demanda atrasada"
      : "demanda";

    div.innerHTML = `

      <h2>${item.titulo}</h2>

      <p>${item.descricao || ""}</p>

      <div class="tags">

        ${
          estaAtrasada(item)
          ? `<span class="tag atrasada">🚨 ATRASADA</span>`
          : ""
        }

        ${
          ehHoje(item)
          ? `<span class="tag hoje">⚠️ HOJE</span>`
          : ""
        }

        <span class="tag">
          ${item.prioridade}
        </span>

        <span class="tag">
          ${item.status}
        </span>

        <span class="tag">
          ${item.responsavel || "sem responsável"}
        </span>

        <span class="tag">
          ${item.prazo || "sem prazo"}
        </span>

      </div>

      <div class="acoes">

        <button onclick="concluirDemanda(${item.id})">
          Arquivar
        </button>

        <button onclick="excluirDemanda(${item.id})">
          Excluir
        </button>

      </div>

    `;

    lista.appendChild(div);

  });

  document.getElementById("countHoje").innerText =
    hoje;

  document.getElementById("countUrgentes").innerText =
    urgentes;

  document.getElementById("countAtrasadas").innerText =
    atrasadas;

  document.getElementById("countArquivadas").innerText =
    arquivadas;
}

async function concluirDemanda(id){

  await client
    .from("demandas")
    .update({
      status:"arquivado"
    })
    .eq("id", id);

  carregarDemandas();
}

async function excluirDemanda(id){

  const confirmar = confirm(
    "Deseja excluir esta demanda?"
  );

  if(!confirmar){
    return;
  }

  await client
    .from("demandas")
    .delete()
    .eq("id", id);

  carregarDemandas();
}

carregarDemandas();
