import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { PanelHeader } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import { useFeedback } from '../../components/ui/Feedback';
import { useSiteContent } from '../../hooks/useSiteContent';
import { DEFAULT_CONTENT, resetContent, saveContent } from '../../services/content';
import type { ProgramEntry, SiteContent } from '../../types';

interface LocalEntry {
  id: string;
  time: string;
  order?: number;
  title: string;
  detail: string;
}

interface LocalDay {
  id: string;
  day: string;
  collapsed: boolean;
  entries: LocalEntry[];
}

const generateId = () => Math.random().toString(36).slice(2, 9);

export const ContentPanel: React.FC = () => {
  const { content, loading } = useSiteContent();
  const { toast, confirm } = useFeedback();
  
  const [draft, setDraft] = useState<SiteContent>(content);
  const [localDays, setLocalDays] = useState<LocalDay[]>([]);
  const [saving, setSaving] = useState(false);

  /** Passa el programa pla de Firestore a l'estructura per dies de l'editor. */
  const loadFromContent = useCallback((source: SiteContent) => {
    setDraft(source);

    const groups: LocalDay[] = [];
    for (const entry of source.programa ?? []) {
      let group = groups.find((g) => g.day === entry.day);
      if (!group) {
        group = { id: generateId(), day: entry.day, collapsed: false, entries: [] };
        groups.push(group);
      }
      group.entries.push({
        id: generateId(),
        time: entry.time,
        order: entry.order,
        title: entry.title,
        detail: entry.detail ?? '',
      });
    }
    setLocalDays(groups);
  }, []);

  useEffect(() => {
    if (!loading) loadFromContent(content);
    // Només en acabar la càrrega inicial: si depengués de `content`, cada
    // snapshot trepitjaria el que l'usuari està escrivint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const patchDraft = (values: Partial<SiteContent>) => setDraft((prev) => ({ ...prev, ...values }));

  const addDay = () => {
    setLocalDays((prev) => [
      ...prev,
      { id: generateId(), day: 'Nou Dia', collapsed: false, entries: [] },
    ]);
  };

  const updateDay = (dayId: string, values: Partial<LocalDay>) => {
    setLocalDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...values } : d)));
  };

  const removeDay = (dayId: string) => {
    setLocalDays((prev) => prev.filter((d) => d.id !== dayId));
  };

  const addEntry = (dayId: string) => {
    setLocalDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        // Calcular l'ordre basant-se en l'últim acte globalment, per comoditat
        const maxOrder = prev.flatMap(d => d.entries).reduce((max, e) => Math.max(max, e.order ?? 0), 0);
        return {
          ...d,
          collapsed: false,
          entries: [
            ...d.entries,
            { id: generateId(), time: '', title: '', detail: '', order: maxOrder + 1 },
          ],
        };
      })
    );
  };

  const updateEntry = (dayId: string, entryId: string, values: Partial<LocalEntry>) => {
    setLocalDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          entries: d.entries.map((e) => (e.id === entryId ? { ...e, ...values } : e)),
        };
      })
    );
  };

  const removeEntry = (dayId: string, entryId: string) => {
    setLocalDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return { ...d, entries: d.entries.filter((e) => e.id !== entryId) };
      })
    );
  };

  const moveDayUp = (index: number) => {
    if (index === 0) return;
    setLocalDays((prev) => {
      const copy = [...prev];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  };

  const moveDayDown = (index: number) => {
    if (index === localDays.length - 1) return;
    setLocalDays((prev) => {
      const copy = [...prev];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
  };

  const flattenDays = (): ProgramEntry[] => {
    return localDays.flatMap((d) =>
      d.entries.map((e) => {
        const entry: ProgramEntry = {
          day: d.day,
          time: e.time,
          title: e.title,
        };
        if (e.order !== undefined) entry.order = e.order;
        if (e.detail) entry.detail = e.detail;
        return entry;
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const finalPrograma = flattenDays();
      await saveContent({
        info_text: draft.info_text,
        programa_intro: draft.programa_intro,
        programa: finalPrograma,
      });
      toast('Contingut desat. Ja es veu a la web.');
    } catch (error) {
      console.error(error);
      toast("No s'ha pogut desar.", 'error');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Restablir el contingut',
      message: 'S’esborraran els textos desats i la web tornarà a mostrar els valors per defecte.',
      confirmLabel: 'Restablir',
      destructive: true,
    });
    if (!ok) return;

    setSaving(true);
    try {
      await resetContent();
      // El listener no torna a passar per `loading`, així que l'editor s'ha de
      // repoblar aquí; si no, es quedaria mostrant el programa que acabem d'esborrar.
      loadFromContent(DEFAULT_CONTENT);
      toast('Contingut restablert als valors per defecte.');
    } catch (error) {
      console.error(error);
      toast("No s'ha pogut restablir el contingut.", 'error');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PanelHeader
        title="Contingut de la web"
        description="Edita el pregó i el programa anuals. Els textos estructurals de la portada són fixes al codi."
        actions={
          <>
            <Button type="button" variant="ghost" onClick={handleReset} disabled={saving}>
              <RotateCcw size={16} /> Restablir valors
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Desant…' : 'Desar canvis'}
            </Button>
          </>
        }
      />

      <div className="flex max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Pregó / text de la Comi</h2>
          <Textarea
            label="Text anual"
            rows={10}
            value={draft.info_text}
            onChange={(event) => patchDraft({ info_text: event.target.value })}
            required
          />
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Programa d&apos;actes</h2>
            <Button variant="ghost" size="sm" onClick={addDay}>
              <Plus size={14} /> Afegir Dia
            </Button>
          </div>

          <Input
            label="Introducció del programa"
            value={draft.programa_intro ?? ''}
            onChange={(event) => patchDraft({ programa_intro: event.target.value })}
          />

          {localDays.length === 0 && (
            <p className="text-sm text-muted">
              Encara no hi ha cap acte. Mentre estigui buit, la web mostra només el cartell.
            </p>
          )}

          {localDays.map((dayGroup, index) => (
            <div key={dayGroup.id} className="flex flex-col border border-hairline bg-white shadow-sm transition-all">
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-hairline bg-ink/5 p-3 sm:px-4">
                <div className="flex flex-grow items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => updateDay(dayGroup.id, { collapsed: !dayGroup.collapsed })}
                    className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-ink/10 hover:text-ink"
                    aria-label={dayGroup.collapsed ? 'Desplegar dia' : 'Col·lapsar dia'}
                  >
                    {dayGroup.collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <input
                    type="text"
                    value={dayGroup.day}
                    onChange={(e) => updateDay(dayGroup.id, { day: e.target.value })}
                    className="flex-grow bg-transparent px-2 py-1 font-bold text-ink outline-none hover:bg-ink/5 focus:bg-white focus:ring-2 focus:ring-brand"
                    placeholder="Nom del dia (ex: Divendres 7)"
                    required
                  />
                </div>
                <div className="ml-4 flex shrink-0 gap-1 sm:gap-2">
                  <div className="mr-1 flex items-center rounded bg-ink/5 sm:mr-2">
                    <button
                      type="button"
                      onClick={() => moveDayUp(index)}
                      disabled={index === 0}
                      className="p-1.5 text-muted hover:text-ink disabled:opacity-30"
                      aria-label="Pujar dia"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDayDown(index)}
                      disabled={index === localDays.length - 1}
                      className="p-1.5 text-muted hover:text-ink disabled:opacity-30"
                      aria-label="Baixar dia"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => addEntry(dayGroup.id)}>
                    <Plus size={14} /> <span className="hidden sm:inline">Afegir acte</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Esborrar dia"
                    onClick={() => {
                      if (dayGroup.entries.length === 0 || window.confirm('Segur que vols esborrar aquest dia i tots els seus actes?')) {
                        removeDay(dayGroup.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Events */}
              {!dayGroup.collapsed && (
                <div className="flex flex-col gap-4 p-4 sm:p-5">
                  {dayGroup.entries.length === 0 && (
                    <p className="text-sm italic text-muted">Aquest dia no té cap acte.</p>
                  )}
                  {dayGroup.entries.map((entry) => (
                    <div key={entry.id} className="relative flex flex-col gap-3 rounded border border-hairline p-4 pl-4 sm:pl-5">
                      <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l bg-brand/20"></div>
                      <div className="grid gap-3 sm:grid-cols-[7rem_5rem_auto] sm:items-end">
                        <Input
                          label="Hora"
                          placeholder="23:00"
                          value={entry.time}
                          onChange={(e) => updateEntry(dayGroup.id, entry.id, { time: e.target.value })}
                          required
                        />
                        <Input
                          label="Ordre"
                          type="number"
                          min="0"
                          value={entry.order ?? ''}
                          onChange={(e) =>
                            updateEntry(dayGroup.id, entry.id, {
                              order: e.target.value === '' ? undefined : Number.parseInt(e.target.value, 10),
                            })
                          }
                        />
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Esborrar acte"
                            onClick={() => removeEntry(dayGroup.id, entry.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <Input
                        label="Acte"
                        placeholder="Orquestra Mediterrània"
                        value={entry.title}
                        onChange={(e) => updateEntry(dayGroup.id, entry.id, { title: e.target.value })}
                        required
                      />
                      <Input
                        label="Detall (opcional)"
                        placeholder="A la plaça. Entrada lliure."
                        value={entry.detail}
                        onChange={(e) => updateEntry(dayGroup.id, entry.id, { detail: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="border-t border-hairline pt-6">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Desant…' : 'Desar canvis'}
          </Button>
        </div>
      </div>
    </form>
  );
};
