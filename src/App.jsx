import { useEffect, useMemo, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { supabase } from './supabase';
import './index.css';

function App() {
  const [pagina, setPagina] = useState('painel');

  //PAINEL DE DISCIPLINA 
  const [turma, setTurma] = useState(null);
  const [disciplinasTurma, setDisciplinasTurma] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [editandoLink, setEditandoLink] = useState(null);

  // NOTAS
  const [alunos, setAlunos] = useState([]);
  const [alunoAberto, setAlunoAberto] = useState(null);
  const [notasAluno, setNotasAluno] = useState({});


  useEffect(() => {
    carregarDadosTurmaDelta();
  }, []);

  useEffect(() => {
    if (turma?.id) {
      carregarAlunos(turma.id);
    }
  }, [turma]);

  async function carregarDadosTurmaDelta() {
    setCarregando(true);
    setErro('');

    // 1. Busca os vínculos existentes em turma_disc
    const { data: vinculos, error: erroVinculos } = await supabase
      .from('turma_disc')
      .select('id, disc_id, turm_id, realizado, nota, avaliacao, link')
      .order('id', { ascending: true });

    console.log('VÍNCULOS TURMA_DISC:', vinculos);
    console.log('ERRO TURMA_DISC:', erroVinculos);

    if (erroVinculos) {
      console.error(erroVinculos);
      setErro('Não foi possível carregar os vínculos da turma.');
      setCarregando(false);
      return;
    }

    if (!vinculos || vinculos.length === 0) {
      setErro('Nenhuma disciplina vinculada à turma foi encontrada.');
      setCarregando(false);
      return;
    }

    const turmaId = vinculos[0].turm_id;

    // 2. Busca os dados da turma usando o turm_id que veio da turma_disc
    const { data: turmaEncontrada, error: erroTurma } = await supabase
      .from('turma')
      .select('id, nome, descricao, dt_inicio, dt_final')
      .eq('id', turmaId)
      .maybeSingle();

    console.log('TURMA ENCONTRADA:', turmaEncontrada);
    console.log('ERRO TURMA:', erroTurma);

    if (erroTurma) {
      setErro('Não foi possível carregar a turma.');
      setCarregando(false);
      return;
    }

    if (!turmaEncontrada) {
      setErro('O ID da turma existe em turma_disc, mas não foi encontrado na tabela turma.');
      setCarregando(false);
      return;
    }

    setTurma(turmaEncontrada);

    // 3. Busca as disciplinas pelos disc_id encontrados em turma_disc
    const idsDisciplinas = vinculos.map((item) => item.disc_id);

    const { data: disciplinas, error: erroDisciplinas } = await supabase
      .from('disciplinas')
      .select('id, nome, docente, cargahr')
      .in('id', idsDisciplinas);

    console.log('DISCIPLINAS:', disciplinas);
    console.log('ERRO DISCIPLINAS:', erroDisciplinas);

    if (erroDisciplinas) {
      console.error(erroDisciplinas);
      setErro('Não foi possível carregar as disciplinas.');
      setCarregando(false);
      return;
    }

    const listaFormatada = vinculos.map((vinculo) => {
      const disciplina = disciplinas?.find((d) => d.id === vinculo.disc_id);

      return {
        id: vinculo.id, // ID da turma_disc
        realizado: vinculo.realizado,
        nota: vinculo.nota,
        avaliacao: vinculo.avaliacao,
        link: vinculo.link,
        disc_id: vinculo.disc_id,
        turm_id: vinculo.turm_id,
        nome: disciplina?.nome || 'Disciplina sem nome',
        docente: disciplina?.docente || 'Sem docente cadastrado',
        cargahr: disciplina?.cargahr || 0,
      };
    });

    // 🔥 ORDENAÇÃO FINAL
    listaFormatada.sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    );

    setDisciplinasTurma(listaFormatada);
    setCarregando(false);
  }

  async function toggleRealizado(id, valorAtual) {
    const novoValor = !valorAtual;

    const { error } = await supabase
      .from('turma_disc')
      .update({ realizado: novoValor })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar realizado:', error);
      alert('Não foi possível atualizar o status da disciplina.');
      return;
    }

    setDisciplinasTurma((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, realizado: novoValor } : item
      )
    );
  }

  function toggleCampo(id, campo, valorAtual) {
    const novoValor = !valorAtual;

    setDisciplinasTurma((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [campo]: novoValor } : item
      )
    );
  }

  // LINK
  function alterarLink(id, valor) {
    setDisciplinasTurma((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, link: valor } : item
      )
    );
  }

  // Botao Salvar Tudo
  async function salvarAlteracoes() {
    setSalvando(true);
    setErro('');

    const resultados = await Promise.all(
      disciplinasTurma.map((disciplina) =>
        supabase
          .from('turma_disc')
          .update({
            realizado: !!disciplina.realizado,
            nota: !!disciplina.nota,
            avaliacao: !!disciplina.avaliacao,
            link: disciplina.link?.trim() || null,
          })
          .eq('id', disciplina.id)
      )
    );

    const erroSalvar = resultados.find((resultado) => resultado.error);

    if (erroSalvar) {
      console.error('Erro ao salvar:', erroSalvar.error);
      setErro('Não foi possível salvar as alterações.');
      setSalvando(false);
      return;
    }

    setSalvando(false);
    alert('Alterações salvas com sucesso!');
  }

  // FUNÇÕES DE NOTAS

  async function carregarAlunos(turmaId) {
    const { data, error } = await supabase
      .from('vw_media_alunos')
      .select('id, nome, turma_id, media')
      .eq('turma_id', turmaId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar alunos:', error);
      return;
    }

    setAlunos(data || []);
  }

  async function toggleAluno(alunoId) {
    if (alunoAberto === alunoId) {
      setAlunoAberto(null);
      setNotasAluno({});
      return;
    }

    setAlunoAberto(alunoId);

    const { data, error } = await supabase
      .from('aluno_notas')
      .select('id, aluno_id, turma_disc_id, nota')
      .eq('aluno_id', alunoId);

    if (error) {
      console.error('Erro ao carregar notas:', error);
      alert('Erro ao carregar notas do aluno.');
      return;
    }

    const notasMap = {};

    (data || []).forEach((item) => {
      notasMap[item.turma_disc_id] = {
        id: item.id,
        nota: item.nota ?? '',
      };
    });

    setNotasAluno(notasMap);
  }

  function alterarNota(turmaDiscId, valor) {
    setNotasAluno((prev) => ({
      ...prev,
      [turmaDiscId]: {
        ...prev[turmaDiscId],
        nota: valor,
      },
    }));
  }

  async function salvarNotasAluno(alunoId) {
    setSalvando(true);

    const registros = disciplinasTurma.map((disciplina) => {
      const notaValor = notasAluno[disciplina.id]?.nota;

      return {
        aluno_id: alunoId,
        turma_disc_id: disciplina.id,
        nota:
          notaValor === '' || notaValor === undefined || notaValor === null
            ? null
            : Number(String(notaValor).replace(',', '.')),
      };
    });

    const { error } = await supabase
      .from('aluno_notas')
      .upsert(registros, {
        onConflict: 'aluno_id,turma_disc_id',
      });

    if (error) {
      console.error('Erro ao salvar notas:', error);
      alert('Erro ao salvar notas do aluno.');
      setSalvando(false);
      return;
    }

    setSalvando(false);
    alert('Notas salvas com sucesso!');
  }


  const stats = useMemo(() => {
    const total = disciplinasTurma.length;
    const concluidas = disciplinasTurma.filter((d) => d.realizado).length;
    const notasLancadas = disciplinasTurma.filter((d) => d.nota).length;
    const linksDisponiveis = disciplinasTurma.filter((d) => d.link && d.link.trim() !== '').length;
    const totalHoras = disciplinasTurma.reduce((acc, d) => acc + (d.cargahr || 0), 0 );

    const horasConcluidas = disciplinasTurma
      .filter((d) => d.realizado)
      .reduce((acc, d) => acc + (d.cargahr || 0), 0);

    const progressoHoras = totalHoras
      ? Math.round((horasConcluidas / totalHoras) * 100)
      : 0;

    const progresso = total ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      concluidas,
      notasLancadas,
      linksDisponiveis,
      progresso,
      totalHoras,
      horasConcluidas,
      progressoHoras,
    };
  }, [disciplinasTurma]);

  return (
    
    <div className="page">
      <div className="container">
        <nav className="menu">
          <button
            className={pagina === 'painel' ? 'menuBtn ativo' : 'menuBtn'}
            onClick={() => setPagina('painel')}
          >
            Painel
          </button>

          <button
            className={pagina === 'notas' ? 'menuBtn ativo' : 'menuBtn'}
            onClick={() => setPagina('notas')}
          >
            Notas
          </button>
        </nav>


        {pagina === 'painel' && (   
        <>
          <header className="hero">
            
            {turma && (
              <div className="turmaHeader">
                <div className="turmaBox">
                  <span className="turmaBadge">
                    {turma.nome} {turma.descricao && `- ${turma.descricao}`}
                  </span>

                  <small className="turmaData">
                    {turma.dt_inicio}
                  </small>
                </div>
              </div>
            )}

            <h1>Painel de Disciplinas</h1>
            <p>Acompanhe o andamento das disciplinas, notas e links da turma.</p>

          
            <div className="progressBox">
              <div className="progressTop">
                <span>Progresso das Disciplinas</span>
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

            <div className="progressBox">
              <div className="progressTop">
                <span>Progresso por carga horária</span>
                <strong>{stats.progressoHoras}%</strong>
              </div>

              <div className="progressBar">
                <div
                  className="progressFill"
                  style={{ width: `${stats.progressoHoras}%` }}
                />
              </div>

              <small>
                {stats.horasConcluidas}h de {stats.totalHoras}h concluídas
              </small>
            </div>
            
          </header>

          <section className="stats">
            <div className="statCard">
              <p>Total de Disciplinas</p>
              <h3>{stats.total}</h3>
            </div>

            <div className="statCard">
              <p>Disciplinas Realizadas</p>
              <h3>{stats.concluidas}</h3>
            </div>

            <div className="statCard">
              <p>Notas Lançadas</p>
              <h3>{stats.notasLancadas}</h3>
            </div>

            <div className="statCard">
              <p>Links Disponíveis</p>
              <h3>{stats.linksDisponiveis}</h3>
            </div>
          </section>

          {carregando && <p className="mensagem">Carregando dados...</p>}
          {erro && <p className="mensagem erro">{erro}</p>}

          {!carregando && !erro && (
            <section className="list">
              {disciplinasTurma.length === 0 ? (
                <p className="mensagem">Nenhuma disciplina vinculada à Turma Delta.</p>
              ) : (
                disciplinasTurma.map((disciplina) => (
                  <div className="card" key={disciplina.id}>
                    <div className="btnCard">
                      <div className="btnContent">
                        <h3>{disciplina.nome}</h3>
                        <p>
                          {disciplina.docente} • {disciplina.cargahr}h
                        </p>
                      </div>
                    </div>

                    <div className="actions">
                      <button
                        className={disciplina.realizado ? 'btn ok' : 'btn'}
                        onClick={() =>
                          toggleRealizado(disciplina.id, disciplina.realizado)
                        } >
                        {disciplina.realizado ? '✔' : '○'} Disciplina realizada
                      </button>
                      <button
                        type="button"
                        className={disciplina.nota ? 'btn ok' : 'btn'}
                        onClick={() => toggleCampo(disciplina.id, 'nota', disciplina.nota)}
                      >
                        {disciplina.nota ? '✔' : '○'} Nota
                      </button>

                      <button
                        type="button"
                        className={disciplina.avaliacao ? 'btn ok' : 'btn'}
                        onClick={() =>
                          toggleCampo(disciplina.id, 'avaliacao', disciplina.avaliacao)
                        }
                      >
                        {disciplina.avaliacao ? '✔' : '○'} Avaliação
                      </button>

                      {/* BOTÃO CENTRAL */}
                      <div className="linkArea">
                        {disciplina.link ? (
                          <a
                            href={disciplina.link}
                            target="_blank"
                            rel="noreferrer"
                            className="btnLink"
                          >
                            Abrir formulário
                          </a>
                        ) : (
                          <button className="btnLink disabled" disabled>
                            Sem link
                          </button>
                        )}

                        <button
                          type="button"
                          className="btnEditarLink"
                          onClick={() =>
                            setEditandoLink(
                              editandoLink === disciplina.id ? null : disciplina.id
                            )
                          }
                        >
                          {editandoLink === disciplina.id ? (
                                <X size={18} />
                              ) : (
                                <Pencil size={18} />
                              )}
                          {/* {editandoLink === disciplina.id ? 'Fechar' : 'Editar'  <Pencil size={16} />} */}
                        </button>
                      </div>
                      {editandoLink === disciplina.id && (
                        <div className="linkInputBox">
                          <input
                            type="url"
                            value={disciplina.link || ''}
                            onChange={(e) => alterarLink(disciplina.id, e.target.value)}
                            placeholder="Cole o link da avaliação"
                          />
                        </div>
                      )}

                    </div>
                  </div>
                ))
              )}
              
            </section>
          
          )        
          } {
            disciplinasTurma.length > 0 && (
            <div className="saveArea">
              <button
                type="button"
                className="btnSalvar"
                onClick={salvarAlteracoes}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
            )}
        </>
        )}

        {pagina === 'notas' && (
          <>
            <header className="hero">
              <h1>Notas dos Alunos</h1>
              <p>Clique em um aluno para lançar ou consultar as notas.</p>
            </header>
            
            {carregando && <p className="mensagem">Carregando dados...</p>}
            {erro && <p className="mensagem erro">{erro}</p>}
            {!carregando && !erro && (
              <section className="list">
                {alunos.length === 0 ? (
                  <p className="mensagem">Nenhum aluno encontrado.</p>
                ) : (
                  alunos.map((aluno) => (
                    <div className="card" key={aluno.id}>
                      <button
                        type="button"
                        className="btnCard"
                        onClick={() => toggleAluno(aluno.id)}
                      >
                        <div className="btnContent">
                          <div className="alunoTopo">
                          <h3>{aluno.nome}</h3>

                          <span className="media"
                            style={{
                              color:
                                aluno.media >= 8
                                  ? 'green'
                                  : aluno.media >= 7
                                  ? 'orange'
                                  : 'red'
                            }}
                          >
                            {aluno.media ?? 0}
                          </span>
                          </div>
                          <p>
                            {alunoAberto === aluno.id
                              ? 'Ocultar notas'
                              : 'Ver notas'}
                          </p>
                          
                        </div>
                                
                        <span className="arrow">
                          {alunoAberto === aluno.id ? '⌃' : '⌄'}
                        </span>
                      </button>

                      {alunoAberto === aluno.id && (
                        
                        <div className="notasAlunoBox">
                          <div className="alunoResumo">
                            
                          </div>
                          {disciplinasTurma
                            .filter((disciplina) => notasAluno[disciplina.id]?.nota)
                            .map((disciplina) => { 
                              const nota = notasAluno[disciplina.id]?.nota
                              return (
                                <div className="notaLinha" key={disciplina.id}>
                                  <div>
                                    <strong>{disciplina.nome}</strong>
                                  </div>

                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    value={notasAluno[disciplina.id]?.nota ?? ''}
                                    onChange={(e) =>
                                      alterarNota(disciplina.id, e.target.value)
                                    }
                                    placeholder="Nota"
                                  />
                                </div> )
                              }
                            )
                          }
                          <div className="saveArea">
                            <button
                              type="button"
                              className="btnSalvar"
                              onClick={() => salvarNotasAluno(aluno.id)}
                              disabled={salvando}
                            >
                              {salvando ? 'Salvando...' : 'Salvar Notas'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
