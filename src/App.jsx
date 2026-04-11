import { useMemo, useState } from "react";
// import { disciplinas as data } from "./data";
import { disciplinasBase } from "./data";
import "./index.css";

const dataComId = disciplinasBase.map((item, index) => ({
  ...item,
  id: index + 1
}));

export default function App() {
  const [disciplinas, setDisciplinas] = useState(dataComId);

  function toggle(id, campo) {
    setDisciplinas((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, [campo]: !d[campo] } : d
      )
    );
  }

  const stats = useMemo(() => {
    const total = disciplinas.length;
    const concluidas = disciplinas.filter((d) => d.realizada).length;
    const notas = disciplinas.filter((d) => d.nota).length;
    const avaliacoes = disciplinas.filter((d) => d.avaliacao).length;
    const progresso = total ? Math.round((concluidas / total) * 100) : 0;

    return { total, concluidas, notas, avaliacoes, progresso };
  }, [disciplinas]);

  return (
    <div className="page">
      <div className="container">
        <header className="hero">
          <span className="badge">Turma Delta</span>
          <h1>Painel de Disciplinas</h1>
          <p>
            Acompanhe as disciplinas já realizadas, notas lançadas
            e avaliações da turma.
          </p>

          <div className="progressBox">
            <div className="progressTop">
              <span>Progresso geral</span>
              <strong>{stats.progresso}%</strong>
            </div>

            <div className="progressBar">
              <div
                className="progressFill"
                style={{ width: `${stats.progresso}%` }}
              />
            </div>

            <small>
              {stats.concluidas} de {stats.total} disciplinas concluídas
            </small>
          </div>
        </header>

        <section className="stats">
          <div className="statCard">
            <p>Total</p>
            <h3>{stats.total}</h3>
          </div>

          <div className="statCard">
            <p>Concluídas</p>
            <h3>{stats.concluidas}</h3>
          </div>

          <div className="statCard">
            <p>Notas</p>
            <h3>{stats.notas}</h3>
          </div>

          <div className="statCard">
            <p>Avaliar Docentes</p>
            <h3>{stats.avaliacoes}</h3>
          </div>
        </section>

        <section className="list">
          {disciplinas.map((d) => (
            <div className="card" key={d.id}>
              <button className="btnCard">
                <div className="btnContent">
                  <h3>{d.nome}</h3>
                  <p>{d.docente} • {d.cargahr}</p>
                </div>
                <span className="arrow">›</span>
              </button>
              <div className="actions">
               <button className={d.realizada ? "btn ok" : "btn"}>
                {d.realizada ? "✔" : "○"} Disciplina realizada
               </button>
               <button className={d.nota ? "btn ok" : "btn"}>
                  {d.nota ? "✔" : "○"} Nota lançada</button>
                <button className={d.avaliacao ? "btn ok" : "btn"}>
                  {d.avaliacao ? "✔" : "○"} Avaliação do Professor</button>
              </div>

              {/* <a href={d.link} target="_blank" rel="noreferrer" className="linkBtn">
                Avaliar Professor
              </a> */}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}