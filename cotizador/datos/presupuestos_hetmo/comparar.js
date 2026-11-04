const M=require(require('path').join(__dirname,'../../app/motor.js'));
const D=require(process.argv[2]);
const vidPorCod={};for(const [k,v] of Object.entries(M.VIDRIOS)) vidPorCod[v.cod.toLowerCase().replace(/\s+/g,' ')]=k;
const alias={'4/12/4 temp':'dvh_temp','4/12/4 inc':'dvh','3+3/9/4 inc':'dvh_lam','3+3/9/3+3 inc':'dvh_lamlam','6t/12/6t':'6T/12/6T','5t/12/5t':'5T/12/5T'};
const rows=[];
for(const r of D){
  const d=r.desc;
  let g=(d.match(/Acristalamiento\s+(.+?)\s+Montaje/i)||[])[1]||'';g=g.trim().toLowerCase().replace(/\s+/g,' ');
  const vid=alias[g]||vidPorCod[g]||null;
  const color=/golden/i.test(r.color)?'golden':/jet black/i.test(r.color)?'negro':/blanc/i.test(r.color)?'blanco':null;
  const mosq=/mosquitera/i.test(d);
  let tipo=null,hojas=0,linea='';
  if(/ y 1 |con 1 Fijo/.test(d)) tipo=null;
  else if(/Corredera.*tres hojas/i.test(d)){tipo='corrediza';hojas=3}
  else if(/Corredera.*dos hojas/i.test(d)){tipo='corrediza';hojas=2;linea=/PRIME 74/.test(d)?'P74':'P90'}
  else if(/Puerta Practicable/i.test(d)){tipo='puerta';hojas=1}
  else if(/Oscilobatiente/i.test(d)){tipo='oscilo';hojas=1}
  else if(/Abatible/i.test(d)){tipo='band';hojas=1}
  else if(/Practicable/i.test(d)){tipo='abrir';hojas=1}
  else if(/Fijo/i.test(d)){tipo='pano';hojas=0}
  const base={num:r.num,fecha:r.fecha,pos:r.pos,med:r.ancho+'x'+r.alto,color:r.color.split(' ')[0],g,mosq,linea,real:r.precio};
  if(!tipo||!vid||!color){rows.push(Object.assign(base,{tipo:tipo||'compuesta',nota:!vid?'vidrio '+g:'',est:null}));continue}
  const it={ancho:r.ancho,alto:r.alto,color,vidrio:vid,secciones:[{tipo,hojas,mano:'izq',mosq,osc:[]}]};
  const p=M.precio(it,{tipoCambio:+process.argv[3]||1565});
  rows.push(Object.assign(base,{tipo:tipo+(hojas>1?hojas:''),est:p.unitario,mosqEst:p.mosq,exacto:M.esExacto(it)}));
}
console.log(JSON.stringify(rows));
