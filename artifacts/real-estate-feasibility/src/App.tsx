import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CircleHelp,
  CloudOff,
  FileText,
  FolderOpen,
  Hammer,
  ImagePlus,
  Info,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  Plus,
  Printer,
  ReceiptText,
  Settings2,
  Ruler,
  Save,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
  Copy,
} from 'lucide-react';
import {
  calculateRegulatoryAreas,
  calculateFinancialAnalysis,
  calculateProjectSnapshot,
  createEmptyProject,
  createProjectId,
  deleteProjectLocally,
  loadCompanySettings,
  loadSavedProjects,
  formatNumber,
  formatPercent,
  formatSAR,
  getCitiesForRegion,
  getConstructionRate,
  getRegulatoryProfile,
  isProjectBasicsReady,
  OTHER_CITY,
  REGIONS,
  saveCompanySettings,
  saveProjectsLocally,
  saveProjectLocally,
  STEP_NAMES,
  type CompanySettings,
  type FeasibilityProject,
  type OptionalFee,
  type PricingBasis,
  type ProjectStepId,
  type ProjectType,
  type ProjectValidationErrors,
  type SoilCondition,
  validateProjectBasics,
} from '@/lib/project-model';
import { printFeasibilityReport } from '@/lib/report-generator';

const STEP_ICONS = [Map, Ruler, Hammer, ReceiptText, TrendingUp, FileText] as const;
const STEP_IDS: ProjectStepId[] = [1, 2, 3, 4, 5, 6];

function Field({
  label,
  hint,
  error,
  children,
  full = false,
  className = '',
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  full?: boolean;
  className?: string;
}) {
  return (
    <div className={`field ${full ? 'full' : ''} ${className}`}>
      <label>{label}</label>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

function WelcomeScreen({
  savedDraft,
  onStart,
  onOpenDraft,
}: {
  savedDraft: FeasibilityProject | null;
  onStart: (name: string, city: string) => void;
  onOpenDraft: () => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('الرياض');

  return (
    <main className="welcome-wrap" dir="rtl">
      <section className="welcome-card" aria-label="بدء دراسة عقارية">
        <div className="welcome-aside">
          <div className="brand-mark" aria-hidden="true">
            <Building2 size={31} strokeWidth={1.6} />
            <TrendingUp size={18} strokeWidth={2.2} />
          </div>
           <div className="eyebrow" style={{ color: '#79ded1' }}>أداة ميدانية — تعمل دون اتصال</div>
          <h1>من قطعة الأرض إلى قرار أوضح.</h1>
          <p>
            مساحة عمل هادئة لتجميع بيانات مشروعك العقاري في السعودية، قبل الدخول إلى الحسابات التفصيلية.
          </p>
          <div className="aside-points">
            <div className="aside-point"><Check size={15} /><span>حفظ محلي تلقائي</span></div>
            <div className="aside-point"><ShieldCheck size={15} /><span>بياناتك تبقى على جهازك</span></div>
            <div className="aside-point"><Ruler size={15} /><span>خطوات مرتبة وقابلة للمراجعة</span></div>
             <div className="aside-point"><TrendingUp size={15} /><span>حسابات مساحة قابلة للمراجعة</span></div>
          </div>
        </div>
        <div className="welcome-main">
          <div className="kicker">تكلفة البناء وجدوى الاستثمار العقاري</div>
          <h2>ابدأ دراسة جديدة</h2>
          <p>أدخل معلومتين فقط للبدء. يمكنك تعديل كل شيء لاحقاً والعودة إلى المسودة دون اتصال بالإنترنت.</p>
          {savedDraft ? (
            <div className="saved-draft" data-testid="card-saved-draft">
              <div className="saved-draft__meta">
                <strong>لديك مسودة محفوظة</strong>
                <span>{savedDraft.name} · {savedDraft.city || 'مدينة غير محددة'}</span>
              </div>
              <button type="button" className="secondary-button button-small" onClick={onOpenDraft} data-testid="button-open-saved-draft">
                <FolderOpen size={15} /> فتح المسودة
              </button>
            </div>
          ) : null}
          <form className="welcome-form" onSubmit={(event) => { event.preventDefault(); onStart(name, city); }}>
            <Field label="اسم المشروع" hint="مثال: عمارة الياسمين — قطعة ٢٤">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="اكتب اسماً يسهل تذكره"
                data-testid="input-onboarding-project-name"
              />
            </Field>
            <Field label="المدينة">
              <select value={city} onChange={(event) => setCity(event.target.value)} data-testid="select-onboarding-city">
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="الدمام">الدمام</option>
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="المدينة المنورة">المدينة المنورة</option>
                <option value="أخرى">مدينة أخرى</option>
              </select>
            </Field>
            <button type="submit" className="primary-button button-wide" data-testid="button-start-new-project">
              <Plus size={17} /> إنشاء مشروع والبدء
            </button>
          </form>
          <div className="notice" style={{ marginTop: 18 }}>
            <LockKeyhole size={16} />
            <span>لا يوجد تسجيل دخول ولا رفع بيانات. هذه نسخة أولية تعمل محلياً على هذا الجهاز.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProjectNav({
  activeStep,
  onStep,
  compact = false,
}: {
  activeStep: ProjectStepId;
  onStep: (step: ProjectStepId) => void;
  compact?: boolean;
}) {
  return (
    <nav className={compact ? 'rail-nav' : 'step-strip'} aria-label="خطوات الدراسة">
      {compact ? (
        <>
          <div className="rail-section-label">مسار الدراسة</div>
          <div className="rail-nav">
            {STEP_IDS.map((step) => {
              const Icon = STEP_ICONS[step - 1];
              return (
                <button
                  type="button"
                  className={`${activeStep === step ? 'is-current' : ''} ${activeStep > step ? 'is-complete' : ''}`}
                  key={step}
                  onClick={() => onStep(step)}
                  data-testid={`button-sidebar-step-${step}`}
                >
                  <span className="rail-step-number">{activeStep > step ? <Check size={12} /> : step}</span>
                  <Icon size={15} />
                  <span>{STEP_NAMES[step]}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="step-strip__line" />
          <div className="step-strip__items">
            {STEP_IDS.map((step) => (
              <button
                type="button"
                className={`step-item ${activeStep === step ? 'is-current' : ''} ${activeStep > step ? 'is-complete' : ''}`}
                key={step}
                onClick={() => onStep(step)}
                data-testid={`button-step-${step}`}
              >
                <span className="step-item__circle">
                  {activeStep > step ? <Check size={14} /> : step}
                </span>
                <span className="step-item__label">{STEP_NAMES[step]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}

function App() {
  const [project, setProject] = useState<FeasibilityProject | null>(null);
  const [savedProjects, setSavedProjects] = useState<FeasibilityProject[]>(() => loadSavedProjects());
  const [savedDraft, setSavedDraft] = useState<FeasibilityProject | null>(() => loadSavedProjects()[0] ?? null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => loadCompanySettings());
  const [activeStep, setActiveStep] = useState<ProjectStepId>(1);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errors, setErrors] = useState<ProjectValidationErrors>({});
  const [showDraftDrawer, setShowDraftDrawer] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showCompanySettings, setShowCompanySettings] = useState(false);

  useEffect(() => {
    if (!project) return;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      const nextProject = { ...project, updatedAt: new Date().toISOString() };
      saveProjectLocally(nextProject);
      const nextProjects = loadSavedProjects().some((item) => item.id === nextProject.id)
        ? loadSavedProjects().map((item) => item.id === nextProject.id ? nextProject : item)
        : [nextProject, ...loadSavedProjects()];
      saveProjectsLocally(nextProjects);
      setSavedProjects(nextProjects);
      setSavedDraft(nextProject);
      setSaveState('saved');
    }, 650);
    return () => window.clearTimeout(timer);
  }, [project]);

  const snapshot = useMemo(
    () => (project ? calculateProjectSnapshot(project) : null),
    [project],
  );

  const patchProject = (patch: Partial<FeasibilityProject>) => {
    setProject((current) => current ? { ...current, ...patch, updatedAt: new Date().toISOString() } : current);
  };

  const patchNested = <K extends 'compliance' | 'build' | 'extras' | 'sales'>(
    key: K,
    patch: Partial<FeasibilityProject[K]>,
  ) => {
    setProject((current) => current ? {
      ...current,
      [key]: { ...current[key], ...patch },
      ...(key === 'compliance' ? {
        compliance: {
          ...current.compliance,
          ...patch,
          overrides: {
            ...current.compliance.overrides,
            ...(['groundFloorPercentage', 'repeatedFloorPercentage', 'annexPercentage', 'basementMaxPercentage', 'parkingPerUnit']
              .filter((field) => field in patch)
              .reduce((acc, field) => ({ ...acc, [field]: true }), {})),
          },
        },
      } : {}),
      updatedAt: new Date().toISOString(),
    } : current);
  };

  const changeProjectType = (type: ProjectType) => {
    setProject((current) => {
      if (!current) return current;
      const profile = getRegulatoryProfile(type);
      return {
        ...current,
        type,
        compliance: {
          ...current.compliance,
          groundFloorPercentage: profile.groundFloorPercentage,
          repeatedFloorPercentage: profile.repeatedFloorPercentage,
          annexPercentage: profile.annexPercentage,
          basementMaxPercentage: profile.basementMaxPercentage,
          parkingPerUnit: profile.parkingPerUnit,
          overrides: {},
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const restoreRegulatoryDefaults = () => {
    if (!project) return;
    const profile = getRegulatoryProfile(project.type);
    setProject((current) => current ? ({
      ...current,
      compliance: {
        ...current.compliance,
        groundFloorPercentage: profile.groundFloorPercentage,
        repeatedFloorPercentage: profile.repeatedFloorPercentage,
        annexPercentage: profile.annexPercentage,
        basementMaxPercentage: profile.basementMaxPercentage,
        parkingPerUnit: profile.parkingPerUnit,
        overrides: {},
      },
      updatedAt: new Date().toISOString(),
    }) : current);
  };

  const startProject = (name: string, city: string) => {
    const fresh = createEmptyProject();
    fresh.name = name.trim() || 'مشروع جديد';
    fresh.city = city;
    setProject(fresh);
    setActiveStep(1);
    setErrors({});
  };

  const openDraft = () => {
    if (!savedDraft) return;
    setProject(savedDraft);
    setActiveStep(1);
    setErrors({});
    setShowDraftDrawer(false);
    setShowMobileNav(false);
  };

  const openProject = (projectId: string) => {
    const selected = savedProjects.find((item) => item.id === projectId);
    if (!selected) return;
    setProject(selected);
    setSavedDraft(selected);
    setActiveStep(1);
    setErrors({});
    setShowDraftDrawer(false);
    setShowMobileNav(false);
  };

  const duplicateProject = (projectId: string) => {
    const source = savedProjects.find((item) => item.id === projectId);
    if (!source) return;
    const now = new Date().toISOString();
    const duplicate = JSON.parse(JSON.stringify(source)) as FeasibilityProject;
    duplicate.id = createProjectId();
    duplicate.name = `${source.name} — نسخة`;
    duplicate.createdAt = now;
    duplicate.updatedAt = now;
    const nextProjects = [duplicate, ...savedProjects];
    setSavedProjects(nextProjects);
    setSavedDraft(duplicate);
    saveProjectsLocally(nextProjects);
    setProject(duplicate);
    setActiveStep(1);
    setShowDraftDrawer(false);
  };

  const deleteProject = (projectId: string) => {
    const nextProjects = savedProjects.filter((item) => item.id !== projectId);
    deleteProjectLocally(projectId);
    setSavedProjects(nextProjects);
    if (project?.id === projectId) {
      setProject(null);
      setSavedDraft(nextProjects[0] ?? null);
    } else if (savedDraft?.id === projectId) {
      setSavedDraft(nextProjects[0] ?? null);
    }
  };

  const startNewProject = () => {
    setProject(null);
    setErrors({});
    setShowDraftDrawer(false);
  };

  const saveNow = () => {
    if (!project) return;
    const nextProject = { ...project, updatedAt: new Date().toISOString() };
    saveProjectLocally(nextProject);
    const nextProjects = loadSavedProjects().some((item) => item.id === nextProject.id)
      ? loadSavedProjects().map((item) => item.id === nextProject.id ? nextProject : item)
      : [nextProject, ...loadSavedProjects()];
    saveProjectsLocally(nextProjects);
    setSavedProjects(nextProjects);
    setSavedDraft(nextProject);
    setSaveState('saved');
  };

  const goToStep = (step: ProjectStepId) => {
    setActiveStep(step);
    setShowMobileNav(false);
  };

  const nextStep = () => {
    if (!project) return;
    if (activeStep === 1) {
      const nextErrors = validateProjectBasics(project);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    setActiveStep((current) => current < 6 ? (current + 1) as ProjectStepId : current);
  };

  const previousStep = () => {
    setActiveStep((current) => current > 1 ? (current - 1) as ProjectStepId : current);
  };

  if (!project) {
    return (
      <WelcomeScreen
        savedDraft={savedDraft}
        onStart={startProject}
        onOpenDraft={openDraft}
      />
    );
  }

  const isReady = isProjectBasicsReady(project);

  return (
    <main className="app-shell" dir="rtl">
      <div className="app-frame">
        <aside className="side-rail">
          <div className="rail-brand">
            <div className="brand-mark brand-mark--small" aria-hidden="true">
              <Building2 size={21} strokeWidth={1.6} />
              <TrendingUp size={12} strokeWidth={2.2} />
            </div>
            <div className="rail-brand__copy">
              <strong>تكلفة البناء والجدوى</strong>
              <span>مساحة عمل عقارية</span>
            </div>
          </div>
          <div className="rail-project">
            <div className="rail-project__title" data-testid="text-sidebar-project-name">{project.name}</div>
            <div className="rail-project__meta">{project.city || 'مدينة غير محددة'} · مسودة محلية</div>
          </div>
          <ProjectNav activeStep={activeStep} onStep={goToStep} compact />
          <div className="rail-bottom">
            <button type="button" className="new-project-rail" onClick={startNewProject} data-testid="button-new-project-sidebar">
              <Plus size={14} /> مشروع جديد
            </button>
            <div className="offline-note">
              <CloudOff size={15} />
              <span>يُحفظ العمل على هذا الجهاز تلقائياً. لا حاجة للاتصال.</span>
            </div>
          </div>
        </aside>

        <section className="workspace">
          <div className="mobile-topbar">
            <div className="mobile-brand">
              <div className="brand-mark brand-mark--small" aria-hidden="true">
                <Building2 size={20} strokeWidth={1.6} />
                <TrendingUp size={11} strokeWidth={2.2} />
              </div>
              <div>
                <strong>تكلفة البناء والجدوى</strong>
                <span>مسودة محلية</span>
              </div>
            </div>
            <button type="button" className="mobile-menu-button" onClick={() => setShowMobileNav(true)} data-testid="button-open-mobile-navigation" aria-label="فتح خطوات الدراسة">
              <Menu size={19} />
            </button>
          </div>
          <header className="workspace-header">
            <div className="header-project">
              <span className="header-project__label">دراسة عقارية أولية</span>
              <h1 className="header-project__name" data-testid="text-project-name">{project.name}</h1>
            </div>
            <div className="header-actions">
              <div className="save-status" data-testid="status-save">
                {saveState === 'saving' ? <><Save size={14} /> جارٍ الحفظ</> : <><Check size={14} /> محفوظ محلياً</>}
              </div>
              <button type="button" className="ghost-button button-small" onClick={() => setShowDraftDrawer(true)} data-testid="button-open-drafts">
                <FolderOpen size={14} /> المسودات
              </button>
              <button type="button" className="ghost-button button-small header-settings-button" onClick={() => setShowCompanySettings(true)} data-testid="button-open-company-settings">
                <Settings2 size={14} /> إعدادات التقرير
              </button>
              <button type="button" className="primary-button button-small" onClick={saveNow} data-testid="button-save-project">
                <Save size={14} /> حفظ الآن
              </button>
            </div>
          </header>

          <ProjectNav activeStep={activeStep} onStep={goToStep} />

          <div className="content-grid">
            <div className="step-heading">
              <div>
                <div className="kicker">الخطوة {activeStep} من ٦</div>
                <h1 data-testid="text-current-step">{STEP_NAMES[activeStep]}</h1>
                <p>{getStepDescription(activeStep)}</p>
              </div>
              <div className="step-count">{activeStep === 1 ? 'نبدأ من البيانات المؤكدة' : 'يمكنك التعديل في أي وقت'}</div>
            </div>

            {activeStep === 1 ? (
              <LandStep project={project} errors={errors} patchProject={patchProject} onTypeChange={changeProjectType} />
            ) : null}
            {activeStep === 2 ? <ComplianceStep project={project} patchNested={patchNested} onRestoreDefaults={restoreRegulatoryDefaults} /> : null}
            {activeStep === 3 ? <BuildStep project={project} patchNested={patchNested} /> : null}
            {activeStep === 4 ? <ExtrasStep project={project} patchNested={patchNested} /> : null}
            {activeStep === 5 ? <SalesStep project={project} patchNested={patchNested} snapshot={snapshot!} /> : null}
            {activeStep === 6 ? <ResultsStep project={project} snapshot={snapshot!} ready={isReady} companySettings={companySettings} /> : null}

            <div className="step-footer">
              <button type="button" className="subtle-link" onClick={() => setShowDraftDrawer(true)} data-testid="button-footer-open-drafts">
                <FolderOpen size={14} /> فتح مسودة محفوظة
              </button>
              <div className="step-footer__actions">
                <button type="button" className="secondary-button" onClick={previousStep} disabled={activeStep === 1} data-testid="button-previous-step">
                  <ArrowRight size={16} /> السابق
                </button>
                <button type="button" className="primary-button" onClick={nextStep} disabled={activeStep === 6} data-testid="button-next-step">
                  {activeStep === 5 ? 'عرض الملخص' : 'التالي'} <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showDraftDrawer ? (
        <DraftDrawer
          projects={savedProjects}
          currentProjectId={project.id}
          onClose={() => setShowDraftDrawer(false)}
          onOpen={openProject}
          onDuplicate={duplicateProject}
          onDelete={deleteProject}
          onNew={startNewProject}
        />
      ) : null}
      {showCompanySettings ? (
        <CompanySettingsDrawer
          settings={companySettings}
          onClose={() => setShowCompanySettings(false)}
          onSave={(nextSettings) => {
            setCompanySettings(nextSettings);
            saveCompanySettings(nextSettings);
          }}
        />
      ) : null}
      {showMobileNav ? (
        <div className="draft-drawer-backdrop" onClick={() => setShowMobileNav(false)}>
          <div className="draft-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-heading">
              <h2>خطوات الدراسة</h2>
              <button type="button" className="icon-button" onClick={() => setShowMobileNav(false)} data-testid="button-close-mobile-navigation" aria-label="إغلاق الخطوات"><X size={17} /></button>
            </div>
            <ProjectNav activeStep={activeStep} onStep={goToStep} compact />
            <button type="button" className="primary-button button-wide" style={{ marginTop: 28 }} onClick={() => { startNewProject(); setShowMobileNav(false); }} data-testid="button-new-project-mobile">
              <Plus size={15} /> بدء مشروع جديد
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function getStepDescription(step: ProjectStepId) {
  const descriptions: Record<ProjectStepId, string> = {
    1: 'ثبّت معلومات القطعة الأساسية قبل الانتقال إلى المساحات.',
    2: 'سجّل ما تعرفه عن التنظيم ونسب البناء المستهدفة.',
    3: 'حدد جودة البناء ومعدل المتر وتكلفة البدروم بشكل منفصل.',
    4: 'أدخل المصاريف الإضافية والاحتياطي والرسوم الاختيارية.',
    5: 'أدخل افتراضات البيع وأسعارك المرجعية المحفوظة محلياً.',
    6: 'راجع الاستثمار والإيرادات والربحية ونقطة التعادل والسيناريوهات.',
  };
  return descriptions[step];
}

function LandStep({
  project,
  errors,
  patchProject,
  onTypeChange,
}: {
  project: FeasibilityProject;
  errors: ProjectValidationErrors;
  patchProject: (patch: Partial<FeasibilityProject>) => void;
  onTypeChange: (type: ProjectType) => void;
}) {
  const cities = getCitiesForRegion(project.region);
  const land = calculateProjectSnapshot(project).land;
  return (
    <div className="form-card">
      <div className="card-grid">
        <Field label="اسم المشروع" hint="اسم داخلي يظهر في رأس الدراسة" full className="project-name-field" error={errors.name}>
          <input value={project.name} onChange={(event) => patchProject({ name: event.target.value })} data-testid="input-project-name" />
        </Field>
        <div className="section-divider"><span>موقع الأرض</span></div>
        <Field label="المنطقة" error={errors.region}>
          <select
            value={project.region}
            onChange={(event) => {
              const region = event.target.value;
              patchProject({ region, city: getCitiesForRegion(region)[0] ?? OTHER_CITY, customCity: '' });
            }}
            data-testid="select-project-region"
          >
            {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </Field>
        <Field label="المدينة" error={errors.city}>
          <select value={project.city} onChange={(event) => patchProject({ city: event.target.value })} data-testid="select-project-city">
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </Field>
        {project.city === OTHER_CITY ? (
          <Field label="اسم المدينة" full>
            <input value={project.customCity} onChange={(event) => patchProject({ customCity: event.target.value })} placeholder="اكتب اسم المدينة" data-testid="input-custom-city" />
          </Field>
        ) : null}
        <Field label="الحي" hint="اختياري — يساعد على تمييز المشروع">
          <div className="input-with-unit">
            <input value={project.district} onChange={(event) => patchProject({ district: event.target.value })} placeholder="مثال: الملقا" data-testid="input-project-district" />
            <MapPin size={15} className="input-unit" />
          </div>
        </Field>
        <div className="section-divider"><span>أبعاد القطعة</span></div>
        <Field label="شكل الأرض" hint="اختر غير منتظمة عندما لا يمكن تمثيل القطعة بعرض × عمق" full>
          <div className="choice-grid choice-grid--compact">
            <button type="button" className={`choice ${project.landShape === 'regular' ? 'is-selected' : ''}`} onClick={() => patchProject({ landShape: 'regular' })}>منتظمة</button>
            <button type="button" className={`choice ${project.landShape === 'irregular' ? 'is-selected' : ''}`} onClick={() => patchProject({ landShape: 'irregular' })}>غير منتظمة</button>
          </div>
        </Field>
        <Field label="مساحة الأرض" hint="المساحة الرسمية أو المسجلة هي المرجع الأساسي" error={errors.landArea}>
          <div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.landArea || ''} onChange={(event) => patchProject({ landArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-area" /><span className="input-unit">م²</span></div>
        </Field>
        {project.landShape === 'regular' ? <>
          <Field label="عرض الأرض" hint="اختياري"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.frontage || ''} onChange={(event) => patchProject({ frontage: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-frontage" /><span className="input-unit">م</span></div></Field>
          <Field label="عمق الأرض" hint="اختياري"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.depth || ''} onChange={(event) => patchProject({ depth: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-depth" /><span className="input-unit">م</span></div></Field>
        </> : <>
          {([['boundaryNorth', 'الحد الشمالي'], ['boundaryEast', 'الحد الشرقي'], ['boundarySouth', 'الحد الجنوبي'], ['boundaryWest', 'الحد الغربي']] as const).map(([key, label]) => (
            <Field key={key} label={label} hint={key === 'boundarySouth' ? 'إذا كان الحد مكسراً أدخل مجموع أطوال أجزائه واذكر التفصيل في الملاحظات' : 'من الصك أو الرخصة'}><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project[key] || ''} onChange={(event) => patchProject({ [key]: Number(event.target.value) || 0 })} placeholder="٠" /><span className="input-unit">م</span></div></Field>
          ))}
          <div className="notice full"><Info size={16} /><span>للأرض غير المنتظمة تعتمد الدراسة على مساحة الأرض الرسمية، وأطوال الحدود معلومات مرجعية فقط.</span></div>
        </>}
        <Field label="عدد الشوارع" hint="اتركه بصفر إذا لم تتأكد" error={errors.streetsCount}>
          <input className="number-input" type="number" min="0" step="1" value={project.streetsCount || ''} onChange={(event) => patchProject({ streetsCount: Number(event.target.value) || 0 })} placeholder="١" data-testid="input-streets-count" />
        </Field>
        <Field label="عرض الشارع التنظيمي" hint="يُستخدم لتقدير الارتداد فقط" error={errors.streetWidth}>
          <div className="input-with-unit">
            <input className="number-input" type="number" min="0" value={project.streetWidth || ''} onChange={(event) => patchProject({ streetWidth: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-street-width" />
            <span className="input-unit">م</span>
          </div>
        </Field>
        <div className="section-divider"><span>قيمة الأرض ومرجعها</span></div>
        <Field label="سعر الأرض للمتر" hint="يحسب قيمة الأرض تقديرياً" error={errors.landPricePerSqm}>
          <div className="input-with-unit">
            <input className="number-input" type="number" min="0" value={project.landPricePerSqm || ''} onChange={(event) => patchProject({ landPricePerSqm: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-price-per-sqm" />
            <span className="input-unit">ر.س</span>
          </div>
        </Field>
        <Field label="سعر الشراء الفعلي المعتمد" hint="إذا أُدخل، يتقدم على القيمة المحسوبة" error={errors.actualPurchasePrice}>
          <div className="input-with-unit">
            <input className="number-input" type="number" min="0" value={project.actualPurchasePrice || ''} onChange={(event) => patchProject({ actualPurchasePrice: Number(event.target.value) || 0 })} placeholder="اختياري" data-testid="input-actual-land-price" />
            <span className="input-unit">ر.س</span>
          </div>
        </Field>
        <Field label="رقم المخطط" hint="اختياري">
          <input value={project.planNumber} onChange={(event) => patchProject({ planNumber: event.target.value })} placeholder="—" data-testid="input-plan-number" />
        </Field>
        <Field label="رقم القطعة" hint="اختياري">
          <input value={project.plotNumber} onChange={(event) => patchProject({ plotNumber: event.target.value })} placeholder="—" data-testid="input-plot-number" />
        </Field>
        <Field label="نوع المشروع" full>
          <div className="choice-grid">
            {(['فيلا سكنية', 'عمارة سكنية', 'عمارة سكنية تجارية', 'مخصص'] as ProjectType[]).map((type) => (
              <button type="button" key={type} className={`choice ${project.type === type ? 'is-selected' : ''}`} onClick={() => onTypeChange(type)} data-testid={`button-project-type-${type}`}>
                <Building2 size={17} /> <span>{type}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="ملاحظات القطعة" hint="أي معلومة غير مؤكدة أو قيد يحتاج مراجعة" full>
          <textarea value={project.notes} onChange={(event) => patchProject({ notes: event.target.value })} placeholder="مثال: يوجد شارع من جهتين، أحتاج مراجعة الارتداد..." rows={3} data-testid="input-land-notes" />
        </Field>
        <div className="summary-list full" data-testid="land-value-summary">
          <div className="summary-row"><span>القيمة المحسوبة</span><strong>{formatSAR(land.calculatedLandValue)}</strong></div>
          <div className="summary-row"><span>القيمة المعتمدة للدراسة</span><strong>{formatSAR(land.approvedLandValue)}</strong></div>
          <div className="summary-row"><span>مصدر القيمة</span><strong>{land.usesActualPurchasePrice ? 'سعر الشراء الفعلي' : 'مساحة الأرض × سعر المتر'}</strong></div>
        </div>
        <div className="notice full">
          <Info size={16} />
          <span>القيمة أعلاه تخص الأرض فقط. لا توجد في هذه المرحلة أي أسعار بناء أو تكلفة للبدروم أو مصاريف إضافية.</span>
        </div>
      </div>
    </div>
  );
}

function ComplianceStep({
  project,
  patchNested,
  onRestoreDefaults,
}: {
  project: FeasibilityProject;
  patchNested: <K extends 'compliance' | 'build' | 'extras' | 'sales'>(key: K, patch: Partial<FeasibilityProject[K]>) => void;
  onRestoreDefaults: () => void;
}) {
  const areas = calculateRegulatoryAreas(project);
  const setback = calculateProjectSnapshot(project).setbacks;
  const status = (key: string, needsVerification = false) => {
    if (project.compliance.overrides[key as keyof FeasibilityProject['compliance']['overrides']]) return { label: 'تعديل يدوي', color: 'hsl(39 86% 44%)' };
    if (needsVerification) return { label: 'يحتاج التحقق', color: 'hsl(6 68% 47%)' };
    return { label: 'افتراض أولي', color: 'hsl(150 55% 38%)' };
  };
  const assumption = (key: string, needsVerification = false) => {
    const item = status(key, needsVerification);
    return <span style={{ color: item.color, fontSize: 10, fontWeight: 800 }}>{item.label}</span>;
  };
  const addServiceArea = () => patchNested('compliance', { serviceAreas: [...project.compliance.serviceAreas, { id: `service-${Date.now()}`, label: '', area: 0 }] });
  const updateServiceArea = (id: string, patch: Partial<{ label: string; area: number }>) => patchNested('compliance', { serviceAreas: project.compliance.serviceAreas.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const deleteServiceArea = (id: string) => patchNested('compliance', { serviceAreas: project.compliance.serviceAreas.filter((item) => item.id !== id) });
  return (
    <div className="placeholder-layout">
      <div className="form-card">
        <div className="placeholder-icon"><Ruler size={23} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 7px', fontSize: 18 }}>المساحات والاشتراطات</h2>
            <p style={{ marginBottom: 22 }}>عدّل الافتراضات عند توفر مخطط أو اشتراط خاص بالمدينة والقطعة.</p>
          </div>
          <button type="button" className="ghost-button button-small" onClick={onRestoreDefaults} data-testid="button-restore-regulatory-defaults">استعادة الافتراضات</button>
        </div>
        <div className="card-grid">
          <Field label="رمز التنظيم" hint="اختياري">
            <input value={project.compliance.zoning} onChange={(event) => patchNested('compliance', { zoning: event.target.value })} placeholder="مثال: سكني أ" data-testid="input-zoning" />
          </Field>
          <Field label={<span>نسبة الأرضي <span style={{ marginInlineStart: 7 }}>{assumption('groundFloorPercentage', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}</span></span>} hint="من مساحة الأرض">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" max="100" value={project.compliance.groundFloorPercentage || ''} onChange={(event) => patchNested('compliance', { groundFloorPercentage: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-ground-floor-percentage" />
              <span className="input-unit">٪</span>
            </div>
          </Field>
          <Field label={<span>نسبة المتكرر <span style={{ marginInlineStart: 7 }}>{assumption('repeatedFloorPercentage', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}</span></span>} hint="من مساحة الأرض">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" max="100" value={project.compliance.repeatedFloorPercentage || ''} onChange={(event) => patchNested('compliance', { repeatedFloorPercentage: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-repeated-floor-percentage" />
              <span className="input-unit">٪</span>
            </div>
          </Field>
          <Field label="عدد الأدوار المتكررة" hint="لا يشمل الأرضي">
            <input className="number-input" type="number" min="0" step="1" value={project.compliance.repeatedFloors || ''} onChange={(event) => patchNested('compliance', { repeatedFloors: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-repeated-floors" />
          </Field>
          <Field label="نسبة الملحق" hint={assumption('annexPercentage', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}>
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" max="100" value={project.compliance.annexPercentage || ''} onChange={(event) => patchNested('compliance', { annexPercentage: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-annex-percentage" />
              <span className="input-unit">٪</span>
            </div>
          </Field>
          <Field label="عدد الوحدات السكنية" hint="يستخدم لحساب المواقف">
            <input className="number-input" type="number" min="0" step="1" value={project.compliance.residentialUnits || ''} onChange={(event) => patchNested('compliance', { residentialUnits: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-residential-units" />
          </Field>
          <Field label="مواقف لكل وحدة" hint={assumption('parkingPerUnit', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}>
            <input className="number-input" type="number" min="0" step="0.5" value={project.compliance.parkingPerUnit || ''} onChange={(event) => patchNested('compliance', { parkingPerUnit: Number(event.target.value) || 0 })} placeholder="١٫٥" data-testid="input-parking-per-unit" />
          </Field>
          <Field label="تفعيل الملحق">
            <div className="choice-grid choice-grid--compact">
              {[{ value: true, label: 'نعم' }, { value: false, label: 'لا' }].map((item) => (
                <button type="button" key={String(item.value)} className={`choice ${project.compliance.annexEnabled === item.value ? 'is-selected' : ''}`} onClick={() => patchNested('compliance', { annexEnabled: item.value })} data-testid={`button-annex-${item.value ? 'yes' : 'no'}`}>{item.label}</button>
              ))}
            </div>
          </Field>
          <Field label="تفعيل البدروم" hint="يظهر منفصلاً ولا يُسعّر">
            <div className="choice-grid choice-grid--compact">
              {[{ value: true, label: 'نعم' }, { value: false, label: 'لا' }].map((item) => (
                <button type="button" key={String(item.value)} className={`choice ${project.compliance.basementEnabled === item.value ? 'is-selected' : ''}`} onClick={() => patchNested('compliance', { basementEnabled: item.value })} data-testid={`button-basement-${item.value ? 'yes' : 'no'}`}>{item.label}</button>
              ))}
            </div>
          </Field>
          <Field label="مساحة البدروم" hint="منفصلة عن المساحة فوق الأرض">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.compliance.basementArea || ''} onChange={(event) => patchNested('compliance', { basementArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-regulatory-basement-area" />
              <span className="input-unit">م²</span>
            </div>
          </Field>
          <Field label={<span>حد البدروم الافتراضي <span style={{ marginInlineStart: 7 }}>{assumption('basementMaxPercentage')}</span></span>} hint="افتراض قابل للتعديل">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" max="100" value={project.compliance.basementMaxPercentage || ''} onChange={(event) => patchNested('compliance', { basementMaxPercentage: Number(event.target.value) || 0 })} placeholder="١٠٠" data-testid="input-basement-max-percentage" />
              <span className="input-unit">٪</span>
            </div>
          </Field>
          <Field label="المساحة المعتمدة فوق الأرض" hint="اتركها صفراً لاستخدام المساحة المحسوبة" full>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="input-with-unit" style={{ flex: 1 }}>
                <input className="number-input" type="number" min="0" value={project.compliance.approvedFeasibilityArea || ''} onChange={(event) => patchNested('compliance', { approvedFeasibilityArea: Number(event.target.value) || 0 })} placeholder={formatNumber(areas.calculatedFeasibilityArea)} data-testid="input-approved-feasibility-area" />
                <span className="input-unit">م²</span>
              </div>
              <button type="button" className="ghost-button button-small" onClick={() => patchNested('compliance', { approvedFeasibilityArea: 0 })} data-testid="button-restore-calculated-area">استخدام المحسوبة</button>
            </div>
          </Field>
          <div className="section-divider"><span>مساحات خدمية / ترخيصية إضافية</span></div>
          <div className="stack-list full">
            <div className="notice"><Info size={16} /><span>تُستخدم هذه المساحات لمطابقة الرخصة أو المخطط، ولا تدخل تلقائياً في تكلفة البناء أو المساحة المعتمدة للجدوى.</span></div>
            {project.compliance.serviceAreas.map((item, index) => (
              <div className="repeat-row" key={item.id}>
                <input value={item.label} onChange={(event) => updateServiceArea(item.id, { label: event.target.value })} placeholder="مثال: بيت درج ومصاعد" />
                <div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={item.area || ''} onChange={(event) => updateServiceArea(item.id, { area: Number(event.target.value) || 0 })} placeholder="٠" /><span className="input-unit">م²</span></div>
                <button type="button" className="danger-button button-small" onClick={() => deleteServiceArea(item.id)}>حذف</button>
              </div>
            ))}
            <button type="button" className="secondary-button button-small" onClick={addServiceArea}>+ إضافة مساحة خدمية</button>
          </div>
        </div>
        <div className="notice" style={{ marginTop: 22 }}>
          <Info size={16} />
          <span>الارتدادات لا تنتج بصمة بناء تلقائية. يلزم توفر عرض الشارع وعدد الشوارع، ثم مراجعة المخطط والاشتراط الرسمي قبل الاعتماد.</span>
        </div>
      </div>
      <div className="completion-card">
        <div className="placeholder-icon" style={{ background: 'rgba(112,225,211,.15)', color: '#8ce9db' }}><Map size={22} /></div>
        <h2>نتيجة المساحات الحالية</h2>
        <p>تتحدث النتائج فوراً من المدخلات، مع إبقاء البدروم منفصلاً عن المساحة فوق الأرض.</p>
        <div className="summary-list summary-list--dark">
          <div className="summary-row"><span>الأرضي</span><strong>{formatNumber(areas.groundFloorArea)} م²</strong></div>
          <div className="summary-row"><span>الدور المتكرر</span><strong>{formatNumber(areas.repeatedFloorArea)} م²</strong></div>
          <div className="summary-row"><span>إجمالي المتكرر</span><strong>{formatNumber(areas.totalRepeatedFloorsArea)} م²</strong></div>
          <div className="summary-row"><span>الملحق</span><strong>{formatNumber(areas.annexArea)} م²</strong></div>
          <div className="summary-row"><span>فوق الأرض</span><strong>{formatNumber(areas.aboveGroundBuiltArea)} م²</strong></div>
          <div className="summary-row"><span>البدروم</span><strong>{formatNumber(areas.basementArea)} م²</strong></div>
          <div className="summary-row"><span>الإجمالي الأساسي</span><strong>{formatNumber(areas.totalBuiltUpArea)} م²</strong></div>
          <div className="summary-row"><span>المساحات الخدمية / الترخيصية</span><strong>{formatNumber(areas.serviceAreasTotal)} م²</strong></div>
          <div className="summary-row"><span>الإجمالي للمطابقة مع الرخصة</span><strong>{formatNumber(areas.licensedAreaWithServices)} م²</strong></div>
          <div className="summary-row"><span>المواقف المطلوبة</span><strong>{formatNumber(areas.requiredParking)}</strong></div>
          <div className="summary-row"><span>الارتداد الأمامي</span><strong>{setback.front === null ? 'يحتاج التحقق' : `${formatNumber(setback.front)} م`}</strong></div>
        </div>
        <div className="metric-empty" style={{ borderColor: 'rgba(236,255,251,.2)', color: 'rgba(236,255,251,.68)' }}>
          <span><CircleHelp size={18} /></span>
          {setback.needsVerification ? 'بيانات الشوارع غير مكتملة؛ الارتدادات تحتاج التحقق.' : 'المساحات تقديرية وليست اعتماداً تنظيمياً.'}
        </div>
      </div>
    </div>
  );
}

 function BuildStep({
  project,
  patchNested,
}: {
  project: FeasibilityProject;
  patchNested: <K extends 'compliance' | 'build' | 'extras' | 'sales'>(key: K, patch: Partial<FeasibilityProject[K]>) => void;
}) {
  const levels: FeasibilityProject['build']['level'][] = ['اقتصادي', 'متوسط', 'فاخر'];
  const basisLabels: Record<PricingBasis, string> = { low: 'منخفض', weighted: 'موصى به', high: 'مرتفع' };
  const areas = calculateProjectSnapshot(project).areas;
  const recommendedRate = getConstructionRate(project.build.level, project.build.pricingBasis);
  const selectedRate = project.build.manualRate > 0 ? project.build.manualRate : recommendedRate;
  return (
    <div className="placeholder-layout">
      <div className="form-card">
        <div className="placeholder-icon"><Hammer size={23} /></div>
        <h2 style={{ margin: '0 0 7px', fontSize: 18 }}>تكلفة البناء والبدروم</h2>
        <p style={{ marginBottom: 22 }}>قيم تقديرية أولية قابلة للتعديل، وليست أسعاراً رسمية أو عرضاً مالياً.</p>
        <Field label="مستوى التشطيب" full>
          <div className="choice-grid">
            {levels.map((level) => (
              <button type="button" key={level} className={`choice ${project.build.level === level ? 'is-selected' : ''}`} onClick={() => patchNested('build', { level })} data-testid={`button-build-level-${level}`}>
                <Building2 size={17} /> <span>{level}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="أساس التسعير" hint="يُستخدم المعدل الموصى به تلقائياً ما لم تدخل تعديلاً يدوياً" full>
          <div className="choice-grid">
            {(Object.keys(basisLabels) as PricingBasis[]).map((basis) => (
              <button type="button" key={basis} className={`choice ${project.build.pricingBasis === basis ? 'is-selected' : ''}`} onClick={() => patchNested('build', { pricingBasis: basis })} data-testid={`button-pricing-basis-${basis}`}>
                <span>{basisLabels[basis]}</span>
                <small>{formatSAR(getConstructionRate(project.build.level, basis))} / م²</small>
              </button>
            ))}
          </div>
        </Field>
        <div className="card-grid" style={{ marginTop: 22 }}>
          <Field label="معدل البناء المعتمد" hint="يتطبق على المساحة المعتمدة فوق الأرض فقط">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.build.manualRate || ''} onChange={(event) => patchNested('build', { manualRate: Number(event.target.value) || 0, costPerSqm: Number(event.target.value) || 0 })} placeholder={formatNumber(recommendedRate)} data-testid="input-approved-construction-rate" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="معدل البدروم" hint="معدل مستقل عن البناء فوق الأرض">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.build.basementRate || ''} onChange={(event) => patchNested('build', { basementRate: Number(event.target.value) || 0 })} placeholder="١٥٠٠" data-testid="input-basement-rate" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="المساحة المعتمدة فوق الأرض" hint="قادمة من الخطوة الثانية">
            <div className="input-with-unit">
              <input className="number-input" type="number" value={areas.approvedFeasibilityArea ? Number(areas.approvedFeasibilityArea.toFixed(2)) : ''} readOnly data-testid="input-approved-area-readonly" />
              <span className="input-unit">م²</span>
            </div>
          </Field>
          <Field label="مساحة البدروم" hint="قادمة من الخطوة الثانية — لا تدخل في معدل البناء">
            <div className="input-with-unit">
              <input className="number-input" type="number" value={areas.basementArea ? Number(areas.basementArea.toFixed(2)) : ''} readOnly data-testid="input-basement-area-readonly" />
              <span className="input-unit">م²</span>
            </div>
          </Field>
        </div>
        <div className="notice" style={{ marginTop: 22 }}>
          <Info size={16} />
          <span>المعدل المحدد: {formatSAR(selectedRate)} / م². زر استعادة المعدل الموصى به يمسح التعديل اليدوي ويعيد أساس التسعير المختار.</span>
        </div>
        <button type="button" className="ghost-button button-small" style={{ marginTop: 12 }} onClick={() => patchNested('build', { manualRate: 0, costPerSqm: 0 })} data-testid="button-restore-construction-rate">
          استعادة المعدل الموصى به ({formatSAR(recommendedRate)} / م²)
        </button>
      </div>
      <div className="completion-card">
        <div className="placeholder-icon" style={{ background: 'rgba(112,225,211,.15)', color: '#8ce9db' }}><BarChart3 size={22} /></div>
        <h2>ملخص معدل البناء</h2>
        <p>يتم فصل تكلفة البدروم عن تكلفة المساحة فوق الأرض ولا تدخل قيمة الأرض في هذه الحسابات.</p>
        <div className="summary-list summary-list--dark">
          <div className="summary-row"><span>المستوى</span><strong>{project.build.level}</strong></div>
          <div className="summary-row"><span>أساس التسعير</span><strong>{basisLabels[project.build.pricingBasis]}</strong></div>
          <div className="summary-row"><span>المعدل المعتمد</span><strong>{formatSAR(selectedRate)} / م²</strong></div>
          <div className="summary-row"><span>المعدل الموصى به</span><strong>{formatSAR(recommendedRate)} / م²</strong></div>
          <div className="summary-row"><span>فوق الأرض</span><strong>{formatNumber(areas.approvedFeasibilityArea)} م²</strong></div>
          <div className="summary-row"><span>البدروم</span><strong>{formatNumber(areas.basementArea)} م²</strong></div>
        </div>
      </div>
    </div>
  );
}

function ExtrasStep({
  project,
  patchNested,
}: {
  project: FeasibilityProject;
  patchNested: <K extends 'compliance' | 'build' | 'extras' | 'sales'>(key: K, patch: Partial<FeasibilityProject[K]>) => void;
}) {
  const costs = calculateProjectSnapshot(project).costs;
  const soilConditions: SoilCondition[] = ['عادي', 'لبشة', 'نزح مياه', 'تحسين تربة', 'خوازيق', 'مخصص'];
  const feeBasisLabels = {
    'before-contingency': 'التكاليف قبل الاحتياطي',
    'after-contingency': 'التكاليف بعد الاحتياطي',
    'land-value': 'قيمة الأرض',
    fixed: 'قيمة ثابتة',
  };
  const updateOtherExpense = (id: string, patch: Partial<{ description: string; amount: number }>) => {
    patchNested('extras', {
      otherExpenses: project.extras.otherExpenses.map((expense) => expense.id === id ? { ...expense, ...patch } : expense),
    });
  };
  const addOtherExpense = () => {
    patchNested('extras', {
      otherExpenses: [...project.extras.otherExpenses, { id: `other-${Date.now()}`, description: '', amount: 0 }],
    });
  };
  const deleteOtherExpense = (id: string) => {
    patchNested('extras', { otherExpenses: project.extras.otherExpenses.filter((expense) => expense.id !== id) });
  };
  const addOptionalFee = () => {
    const fee: OptionalFee = {
      id: `fee-${Date.now()}`,
      name: '',
      enabled: false,
      kind: 'fixed',
      percentage: 0,
      fixedAmount: 0,
      basis: 'fixed',
      scope: 'development',
    };
    patchNested('extras', { optionalFees: [...project.extras.optionalFees, fee] });
  };
  const updateOptionalFee = (id: string, patch: Partial<OptionalFee>) => {
    patchNested('extras', {
      optionalFees: project.extras.optionalFees.map((fee) => fee.id === id ? { ...fee, ...patch } : fee),
    });
  };
  const deleteOptionalFee = (id: string) => {
    patchNested('extras', { optionalFees: project.extras.optionalFees.filter((fee) => fee.id !== id) });
  };
  return (
    <div className="placeholder-layout">
      <div className="form-card">
        <div className="placeholder-icon"><ReceiptText size={23} /></div>
        <h2 style={{ margin: '0 0 7px', fontSize: 18 }}>المصاريف الإضافية والاحتياطي</h2>
        <p style={{ marginBottom: 22 }}>أدخل القيم المعروفة فقط. البنود الاختيارية متوقفة افتراضياً ولا تمثل معاملة ضريبية مؤكدة.</p>
        <div className="card-grid">
          <Field label="عدد المصاعد" hint="لا يتم تسعير المصعد تلقائياً">
            <input className="number-input" type="number" min="0" step="1" value={project.extras.elevatorCount || ''} onChange={(event) => patchNested('extras', { elevatorCount: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-elevator-count" />
          </Field>
          <Field label="تكلفة المصعد الواحد">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.elevatorCost || ''} onChange={(event) => patchNested('extras', { elevatorCost: Number(event.target.value) || 0 })} placeholder="١٠٠٠٠٠" data-testid="input-elevator-cost" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="الأعمال الخارجية والأسوار والبوابات">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.externalWorks || ''} onChange={(event) => patchNested('extras', { externalWorks: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-external-works" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="الخزانات والخدمات">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.tanksServices || ''} onChange={(event) => patchNested('extras', { tanksServices: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-tanks-services" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="التصميم والإشراف">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.designSupervision || ''} onChange={(event) => patchNested('extras', { designSupervision: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-design-supervision" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="الرخص والتصاريح">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.licensesFees || ''} onChange={(event) => patchNested('extras', { licensesFees: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-licenses-fees" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="التأمين">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.insurance || ''} onChange={(event) => patchNested('extras', { insurance: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-insurance" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="التوصيلات والخدمات">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.utilityConnections || ''} onChange={(event) => patchNested('extras', { utilityConnections: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-utility-connections" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="حالة التربة والتأسيس" hint="الخيار وصفي ولا يضيف تكلفة تلقائياً">
            <select value={project.extras.soilCondition} onChange={(event) => patchNested('extras', { soilCondition: event.target.value as SoilCondition })} data-testid="select-soil-condition">
              {soilConditions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
            </select>
          </Field>
          <Field label="تكلفة التربة / التأسيس المدخلة">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.extras.soilCost || ''} onChange={(event) => patchNested('extras', { soilCost: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-soil-cost" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="نسبة الاحتياطي" hint="تطبق على تكاليف التطوير المؤهلة فقط" full>
            <div className="choice-grid choice-grid--compact">
              {[0, 5, 10].map((rate) => (
                <button type="button" key={rate} className={`choice ${project.extras.contingencyRate === rate ? 'is-selected' : ''}`} onClick={() => patchNested('extras', { contingencyRate: rate, contingency: rate })} data-testid={`button-contingency-${rate}`}>{rate}٪</button>
              ))}
            </div>
            <div className="input-with-unit" style={{ marginTop: 10 }}>
              <input className="number-input" type="number" min="0" max="100" value={project.extras.contingencyRate} onChange={(event) => patchNested('extras', { contingencyRate: Number(event.target.value) || 0, contingency: Number(event.target.value) || 0 })} placeholder="مخصص" data-testid="input-contingency-rate" />
              <span className="input-unit">٪</span>
            </div>
          </Field>
        </div>
        <div className="section-divider" style={{ marginTop: 24 }}><span>مصروفات إضافية مخصصة</span></div>
        <div className="stack-list">
          {project.extras.otherExpenses.map((expense, index) => (
            <div className="repeat-row" key={expense.id}>
              <input value={expense.description} onChange={(event) => updateOtherExpense(expense.id, { description: event.target.value })} placeholder={`وصف المصروف ${index + 1}`} data-testid={`input-other-expense-description-${index}`} />
              <div className="input-with-unit">
                <input className="number-input" type="number" min="0" value={expense.amount || ''} onChange={(event) => updateOtherExpense(expense.id, { amount: Number(event.target.value) || 0 })} placeholder="٠" data-testid={`input-other-expense-amount-${index}`} />
                <span className="input-unit">ر.س</span>
              </div>
              <button type="button" className="danger-button button-small" onClick={() => deleteOtherExpense(expense.id)} data-testid={`button-delete-other-expense-${index}`}>حذف</button>
            </div>
          ))}
          <button type="button" className="secondary-button button-small" onClick={addOtherExpense} data-testid="button-add-other-expense">+ إضافة مصروف</button>
        </div>
        <div className="section-divider" style={{ marginTop: 24 }}><span>الرسوم والضرائب الاختيارية المتقدمة</span></div>
        <div className="notice" style={{ marginBottom: 14 }}>
          <Info size={16} />
          <span>هذه البنود متوقفة افتراضياً. تفعيلها مسؤولية المستخدم، وتختلف الضرائب ورسوم المعاملات حسب المشروع والعملية ولا يتم افتراض انطباق معاملة سعودية محددة تلقائياً.</span>
        </div>
        <div className="stack-list">
          {project.extras.optionalFees.map((fee, index) => (
            <div className="repeat-card" key={fee.id}>
              <div className="repeat-card__header">
                <strong>رسم اختياري {index + 1}</strong>
                <button type="button" className="danger-button button-small" onClick={() => deleteOptionalFee(fee.id)} data-testid={`button-delete-optional-fee-${index}`}>حذف</button>
              </div>
              <div className="card-grid">
                <Field label="اسم الرسم">
                  <input value={fee.name} onChange={(event) => updateOptionalFee(fee.id, { name: event.target.value })} placeholder="مثال: رسم معاملة" data-testid={`input-optional-fee-name-${index}`} />
                </Field>
                <Field label="التفعيل">
                  <label className="inline-check"><input type="checkbox" checked={fee.enabled} onChange={(event) => updateOptionalFee(fee.id, { enabled: event.target.checked })} data-testid={`input-optional-fee-enabled-${index}`} /> تفعيل هذا الرسم</label>
                </Field>
                <Field label="نوع القيمة">
                  <select value={fee.kind} onChange={(event) => updateOptionalFee(fee.id, { kind: event.target.value as OptionalFee['kind'] })} data-testid={`select-optional-fee-kind-${index}`}>
                    <option value="fixed">مبلغ ثابت</option>
                    <option value="percentage">نسبة مئوية</option>
                  </select>
                </Field>
                <Field label={fee.kind === 'percentage' ? 'النسبة' : 'المبلغ'}>
                  <div className="input-with-unit">
                    <input className="number-input" type="number" min="0" max={fee.kind === 'percentage' ? 100 : undefined} value={(fee.kind === 'percentage' ? fee.percentage : fee.fixedAmount) || ''} onChange={(event) => updateOptionalFee(fee.id, fee.kind === 'percentage' ? { percentage: Number(event.target.value) || 0 } : { fixedAmount: Number(event.target.value) || 0 })} placeholder="٠" data-testid={`input-optional-fee-value-${index}`} />
                    <span className="input-unit">{fee.kind === 'percentage' ? '٪' : 'ر.س'}</span>
                  </div>
                </Field>
                <Field label="أساس الحساب">
                  <select value={fee.basis} onChange={(event) => updateOptionalFee(fee.id, { basis: event.target.value as OptionalFee['basis'] })} data-testid={`select-optional-fee-basis-${index}`}>
                    {(Object.keys(feeBasisLabels) as OptionalFee['basis'][]).map((basis) => <option key={basis} value={basis}>{feeBasisLabels[basis]}</option>)}
                  </select>
                </Field>
                <Field label="نطاق الرسم" hint="يفصل رسوم الأرض/المعاملة عن تكلفة التطوير">
                  <select value={fee.scope} onChange={(event) => updateOptionalFee(fee.id, { scope: event.target.value as OptionalFee['scope'] })} data-testid={`select-optional-fee-scope-${index}`}>
                    <option value="development">تكلفة التطوير</option>
                    <option value="land-transaction">الأرض / المعاملة</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
          <button type="button" className="secondary-button button-small" onClick={addOptionalFee} data-testid="button-add-optional-fee">+ إضافة رسم اختياري</button>
        </div>
      </div>
      <div className="completion-card">
        <div className="placeholder-icon" style={{ background: 'rgba(112,225,211,.15)', color: '#8ce9db' }}><ReceiptText size={22} /></div>
        <h2>ملخص تكاليف المرحلة الثالثة</h2>
        <p>قيمة الأرض للعرض فقط ولا تدخل في أساس الاحتياطي.</p>
        <div className="summary-list">
          <div className="summary-row"><span>قبل الاحتياطي</span><strong>{formatSAR(costs.eligibleCostBeforeContingency)}</strong></div>
          <div className="summary-row"><span>الاحتياطي ({formatNumber(costs.contingencyRate)}٪)</span><strong>{formatSAR(costs.contingencyAmount)}</strong></div>
          <div className="summary-row"><span>بعد الاحتياطي</span><strong>{formatSAR(costs.eligibleCostAfterContingency)}</strong></div>
          <div className="summary-row"><span>رسوم تطوير اختيارية</span><strong>{formatSAR(costs.developmentOptionalFeesTotal)}</strong></div>
          <div className="summary-row"><span>رسوم أرض / معاملة</span><strong>{formatSAR(costs.landTransactionFeesTotal)}</strong></div>
          <div className="summary-row"><span>Subtotal المرحلة الثالثة</span><strong>{formatSAR(costs.developmentCostSubtotal)}</strong></div>
        </div>
        {!costs.costsValid ? <div className="metric-empty" style={{ color: '#ffd7cf' }}><Info size={20} /> راجع المدخلات: {costs.validationMessages.join('، ')}</div> : null}
      </div>
    </div>
  );
}

function SalesStep({
  project,
  patchNested,
  snapshot,
}: {
  project: FeasibilityProject;
  patchNested: <K extends 'compliance' | 'build' | 'extras' | 'sales'>(key: K, patch: Partial<FeasibilityProject[K]>) => void;
  snapshot: ReturnType<typeof calculateProjectSnapshot>;
}) {
  const finance = snapshot.finance;
  const cityLabel = project.city === OTHER_CITY ? project.customCity || OTHER_CITY : project.city;
  const savedPrices = project.sales.savedSalePrices ?? [];
  const scenarioDefaults = [-10, 0, 10];
  const updateScenarioAdjustment = (index: number, value: number) => {
    const adjustments = [...(project.sales.scenarioAdjustments ?? scenarioDefaults)];
    while (adjustments.length < 3) adjustments.push(scenarioDefaults[adjustments.length]);
    adjustments[index] = value;
    patchNested('sales', { scenarioAdjustments: adjustments.slice(0, 3) });
  };
  const saveSalePrice = () => {
    if (!(project.sales.salePricePerSqm > 0)) return;
    const entry = {
      id: `sale-price-${Date.now()}`,
      region: project.region,
      city: cityLabel,
      district: project.district,
      propertyType: project.type,
      pricePerSqm: project.sales.salePricePerSqm,
      date: new Date().toISOString().slice(0, 10),
    };
    patchNested('sales', { savedSalePrices: [entry, ...savedPrices] });
  };
  const reuseSalePrice = (price: number) => patchNested('sales', { salePricePerSqm: price });
  const deleteSalePrice = (id: string) => patchNested('sales', { savedSalePrices: savedPrices.filter((entry) => entry.id !== id) });
  return (
    <div className="placeholder-layout">
      <div className="form-card">
        <div className="placeholder-icon"><TrendingUp size={23} /></div>
        <h2 style={{ margin: '0 0 7px', fontSize: 18 }}>افتراضات البيع والسيناريوهات</h2>
        <p style={{ marginBottom: 22 }}>أدخل متوسط سعر البيع المتوقع للمتر كافتراض محفوظ محلياً، وليس كسعر سوق مباشر أو توصية استثمارية.</p>
        <div className="card-grid">
          <Field label="متوسط سعر البيع المتوقع للمتر" hint="اختياري — أدخل افتراضك أنت">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.sales.salePricePerSqm || ''} onChange={(event) => patchNested('sales', { salePricePerSqm: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-sale-price" />
              <span className="input-unit">ر.س</span>
            </div>
          </Field>
          <Field label="المساحة القابلة للبيع" hint="لا تستبدل تلقائياً بالمساحة المبنية">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.sales.salesArea || ''} onChange={(event) => patchNested('sales', { salesArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-sales-area" />
              <span className="input-unit">م²</span>
            </div>
          </Field>
          <Field label="هدف الربح على التكلفة" hint="يستخدم في السعر المستهدف المخصص">
            <div className="input-with-unit">
              <input className="number-input" type="number" min="0" value={project.sales.targetProfitRate} onChange={(event) => patchNested('sales', { targetProfitRate: Number(event.target.value) || 0 })} placeholder="٢٠" data-testid="input-target-profit-rate" />
              <span className="input-unit">٪</span>
            </div>
          </Field>
          <Field label="طريقة البيع" full>
            <select value={project.sales.sellMethod} onChange={(event) => patchNested('sales', { sellMethod: event.target.value })} data-testid="select-sale-method">
              <option value="بيع الوحدات">بيع الوحدات</option>
              <option value="التأجير">التأجير</option>
              <option value="بيع على الخارطة">بيع على الخارطة</option>
              <option value="لم يحدد بعد">لم يحدد بعد</option>
            </select>
          </Field>
        </div>
        <div className="button-row" style={{ marginTop: 18 }}>
          <button type="button" className="secondary-button button-small" onClick={saveSalePrice} disabled={!(project.sales.salePricePerSqm > 0)} data-testid="button-save-sale-price">
            <Save size={14} /> حفظ هذا السعر محلياً
          </button>
        </div>
        <div className="section-divider" style={{ marginTop: 25 }}><span>تعديلات السيناريوهات الحسابية</span></div>
        <p className="section-note">هذه حساسية رياضية حول السعر المدخل، وليست توقعات سوقية.</p>
        <div className="card-grid">
          {['محافظ', 'متوقع', 'متفائل'].map((label, index) => (
            <Field key={label} label={label} hint="التعديل على السعر المتوقع">
              <div className="input-with-unit">
                <input className="number-input" type="number" min="-100" max="100" value={(project.sales.scenarioAdjustments ?? scenarioDefaults)[index] ?? scenarioDefaults[index]} onChange={(event) => updateScenarioAdjustment(index, Number(event.target.value) || 0)} data-testid={`input-sales-scenario-adjustment-${index}`} />
                <span className="input-unit">٪</span>
              </div>
            </Field>
          ))}
        </div>
        <div className="section-divider" style={{ marginTop: 25 }}><span>أسعار محفوظة من المستخدم</span></div>
        <p className="section-note">مراجع محلية مرتبطة بالسياق المدخل، وليست بيانات سوق حالية.</p>
        {savedPrices.length ? (
          <div className="stack-list">
            {savedPrices.map((entry) => (
              <div className="saved-price-row" key={entry.id}>
                <div>
                  <strong>{formatSAR(entry.pricePerSqm)} / م²</strong>
                  <span>{entry.region} · {entry.city}{entry.district ? ` · ${entry.district}` : ''} · {entry.propertyType} · {entry.date}</span>
                </div>
                <div className="button-row">
                  <button type="button" className="ghost-button button-small" onClick={() => reuseSalePrice(entry.pricePerSqm)} data-testid={`button-reuse-sale-price-${entry.id}`}>استخدام</button>
                  <button type="button" className="danger-button button-small" onClick={() => deleteSalePrice(entry.id)} data-testid={`button-delete-sale-price-${entry.id}`}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="metric-empty metric-empty--short">لا توجد أسعار محفوظة بعد.</div>
        )}
      </div>
      <div className="completion-card">
        <div className="placeholder-icon" style={{ background: 'rgba(112,225,211,.15)', color: '#8ce9db' }}><BarChart3 size={22} /></div>
        <h2>قراءة مالية أولية</h2>
        <p>تظهر الحسابات التي يمكن بناؤها من المدخلات، مع إبقاء الإيرادات والربح غير متاحين حتى يدخل المستخدم سعراً ومساحة بيع صالحين.</p>
        <div className="summary-list summary-list--dark">
          <div className="summary-row"><span>قيمة الأرض</span><strong>{formatSAR(finance.landValue)}</strong></div>
          <div className="summary-row"><span>التطوير دون الأرض</span><strong>{formatSAR(finance.developmentCostWithoutLand)}</strong></div>
          <div className="summary-row"><span>إجمالي الاستثمار</span><strong>{formatSAR(finance.totalInvestment)}</strong></div>
          <div className="summary-row"><span>نقطة التعادل</span><strong>{finance.breakEvenSalePricePerSqm === null ? 'غير متاحة' : `${formatSAR(finance.breakEvenSalePricePerSqm)} / م²`}</strong></div>
          <div className="summary-row"><span>سعر هدف {formatNumber(finance.targetProfitRate)}٪</span><strong>{finance.targetProfitSalePricePerSqm === null ? 'غير متاح' : `${formatSAR(finance.targetProfitSalePricePerSqm)} / م²`}</strong></div>
        </div>
        <div className="metric-empty" style={{ borderColor: 'rgba(236,255,251,.2)', color: 'rgba(236,255,251,.68)' }}>
          <span><Info size={20} /></span>
          {finance.revenue === null ? 'الإيرادات والربح يتطلبان سعر بيع ومساحة قابلة للبيع.' : finance.feasibility.label}
        </div>
      </div>
    </div>
  );
}

function ResultsStep({
  project,
  snapshot,
  ready,
  companySettings,
}: {
  project: FeasibilityProject;
  snapshot: ReturnType<typeof calculateProjectSnapshot>;
  ready: boolean;
  companySettings: CompanySettings;
}) {
  const [whatIfAdjustment, setWhatIfAdjustment] = useState(0);
  const cityLabel = project.city === OTHER_CITY ? project.customCity || OTHER_CITY : project.city;
  const areas = snapshot.areas;
  const costs = snapshot.costs;
  const enabledOptionalFees = costs.optionalFees.filter((fee) => fee.enabled);
  const baseFinance = snapshot.finance;
  const whatIfFinance = calculateFinancialAnalysis(project, whatIfAdjustment);
  const money = (value: number | null) => value === null ? 'غير متاح' : formatSAR(value);
  const moneyPerSqm = (value: number | null) => value === null ? 'غير متاح' : `${formatSAR(value)} / م²`;
  const percent = (value: number | null) => value === null ? 'غير متاح' : formatPercent(value * 100);
  const targetRows = baseFinance.targetProfitScenarios;
  return (
    <div className="placeholder-layout">
      <div className="form-card">
        <div className="placeholder-icon"><FileText size={23} /></div>
        <h2 style={{ margin: '0 0 7px', fontSize: 18 }}>ملخص الاستثمار والجدوى</h2>
        <p>هذه قراءة حسابية أولية مبنية على افتراضات المستخدم، وليست سعراً سوقياً أو توصية استثمارية.</p>
        <div className="report-action">
          <button type="button" className="primary-button button-wide" onClick={() => printFeasibilityReport(project, snapshot, companySettings, whatIfAdjustment)} data-testid="button-print-report">
            <Printer size={16} /> طباعة / حفظ التقرير PDF
          </button>
          <span>يفتح تقريراً عربياً منسقاً بمقاس A4 ويمكن حفظه كـ PDF من نافذة الطباعة.</span>
        </div>
        <div className="summary-list">
          <div className="summary-row"><span>اسم المشروع</span><strong>{project.name}</strong></div>
          <div className="summary-row"><span>موقع المشروع</span><strong>{cityLabel}{project.district ? ` · ${project.district}` : ''}</strong></div>
          <div className="summary-row"><span>مساحة الأرض</span><strong>{project.landArea ? `${formatNumber(project.landArea)} م²` : 'غير مدخلة'}</strong></div>
          <div className="summary-row"><span>قيمة الأرض المعتمدة</span><strong>{formatSAR(snapshot.land.approvedLandValue)}</strong></div>
          <div className="summary-row"><span>الأرضي / الدور المتكرر</span><strong>{formatNumber(areas.groundFloorArea)} / {formatNumber(areas.repeatedFloorArea)} م²</strong></div>
          <div className="summary-row"><span>إجمالي المتكرر</span><strong>{formatNumber(areas.totalRepeatedFloorsArea)} م²</strong></div>
          <div className="summary-row"><span>الملحق</span><strong>{formatNumber(areas.annexArea)} م²</strong></div>
          <div className="summary-row"><span>فوق الأرض</span><strong>{formatNumber(areas.aboveGroundBuiltArea)} م²</strong></div>
          <div className="summary-row"><span>البدروم</span><strong>{formatNumber(areas.basementArea)} م² <small>(منفصل)</small></strong></div>
          <div className="summary-row"><span>الإجمالي</span><strong>{formatNumber(areas.totalBuiltUpArea)} م²</strong></div>
          <div className="summary-row"><span>المساحة المعتمدة فوق الأرض</span><strong>{formatNumber(areas.approvedFeasibilityArea)} م²{areas.feasibilityIsManual ? ' · تعديل يدوي' : ''}</strong></div>
          <div className="summary-row"><span>المواقف المطلوبة</span><strong>{formatNumber(areas.requiredParking)}</strong></div>
          <div className="summary-row"><span>كفاءة المساحة القابلة للبيع</span><strong>{areas.saleableEfficiency === null ? 'غير محسوبة' : formatPercent(areas.saleableEfficiency)}</strong></div>
          <div className="summary-row"><span>حالة المدخلات الأساسية</span><strong style={{ color: ready ? 'hsl(150 55% 39%)' : 'hsl(39 86% 43%)' }}>{ready ? 'مكتملة مبدئياً' : 'تحتاج مراجعة'}</strong></div>
        </div>
        <h3 style={{ margin: '24px 0 10px', fontSize: 15 }}>ملخص تكاليف التطوير</h3>
        <div className="summary-list">
          <div className="summary-row"><span>مستوى البناء / أساس التسعير</span><strong>{project.build.level} · {project.build.pricingBasis === 'low' ? 'منخفض' : project.build.pricingBasis === 'high' ? 'مرتفع' : 'موصى به'}</strong></div>
          <div className="summary-row"><span>معدل البناء المعتمد</span><strong>{formatSAR(costs.selectedConstructionRate)} / م²</strong></div>
          <div className="summary-row"><span>تكلفة البناء فوق الأرض</span><strong>{formatSAR(costs.aboveGroundConstructionCost)}</strong></div>
          <div className="summary-row"><span>مساحة البدروم</span><strong>{formatNumber(areas.basementArea)} م²</strong></div>
          <div className="summary-row"><span>معدل البدروم</span><strong>{formatSAR(costs.basementRate)} / م²</strong></div>
          <div className="summary-row"><span>تكلفة البدروم</span><strong>{formatSAR(costs.basementCost)}</strong></div>
          <div className="summary-row"><span>المصاعد</span><strong>{formatSAR(costs.elevatorCost)}</strong></div>
          <div className="summary-row"><span>الأعمال الخارجية</span><strong>{formatSAR(costs.externalWorks)}</strong></div>
          <div className="summary-row"><span>الخزانات والخدمات</span><strong>{formatSAR(costs.tanksServices)}</strong></div>
          <div className="summary-row"><span>التصميم والإشراف</span><strong>{formatSAR(costs.designSupervision)}</strong></div>
          <div className="summary-row"><span>الرخص والتصاريح</span><strong>{formatSAR(costs.licensesFees)}</strong></div>
          <div className="summary-row"><span>التأمين</span><strong>{formatSAR(costs.insurance)}</strong></div>
          <div className="summary-row"><span>التوصيلات</span><strong>{formatSAR(costs.utilityConnections)}</strong></div>
          <div className="summary-row"><span>التربة والتأسيس</span><strong>{project.extras.soilCondition} · {formatSAR(costs.soilCost)}</strong></div>
          <div className="summary-row"><span>المصروفات الأخرى</span><strong>{formatSAR(costs.otherExpenses.reduce((sum, item) => sum + item.amount, 0))}</strong></div>
          <div className="summary-row"><span>المؤهل قبل الاحتياطي</span><strong>{formatSAR(costs.eligibleCostBeforeContingency)}</strong></div>
          <div className="summary-row"><span>الاحتياطي ({formatNumber(costs.contingencyRate)}٪)</span><strong>{formatSAR(costs.contingencyAmount)}</strong></div>
          <div className="summary-row"><span>الرسوم الاختيارية المفعلة</span><strong>{enabledOptionalFees.length ? enabledOptionalFees.map((fee) => fee.name || 'بدون اسم').join('، ') : 'لا يوجد'} · {formatSAR(costs.optionalFeesTotal)}</strong></div>
          <div className="summary-row"><span>منها رسوم التطوير</span><strong>{formatSAR(costs.developmentOptionalFeesTotal)}</strong></div>
          <div className="summary-row"><span>منها رسوم الأرض / المعاملة</span><strong>{formatSAR(costs.landTransactionFeesTotal)}</strong></div>
          <div className="summary-row"><span>Subtotal المرحلة الثالثة</span><strong>{formatSAR(costs.developmentCostSubtotal)}</strong></div>
        </div>
        <h3 style={{ margin: '24px 0 10px', fontSize: 15 }}>الاستثمار والتكلفة لكل متر</h3>
        <div className="summary-list">
          <div className="summary-row"><span>تكلفة التطوير دون الأرض</span><strong>{formatSAR(baseFinance.developmentCostWithoutLand)}</strong></div>
          <div className="summary-row"><span>رسوم الأرض / المعاملة</span><strong>{formatSAR(baseFinance.landTransactionFees)}</strong></div>
          <div className="summary-row"><span>إجمالي الاستثمار</span><strong>{formatSAR(baseFinance.totalInvestment)}</strong></div>
          <div className="summary-row"><span>تكلفة التطوير / م² معتمد</span><strong>{moneyPerSqm(baseFinance.developmentCostPerSqm)}</strong></div>
          <div className="summary-row"><span>تكلفة الاستثمار / م² معتمد</span><strong>{moneyPerSqm(baseFinance.investmentCostPerSqm)}</strong></div>
        </div>
        <h3 style={{ margin: '24px 0 10px', fontSize: 15 }}>الإيرادات والربحية</h3>
        <div className="summary-list">
          <div className="summary-row"><span>متوسط سعر البيع المتوقع</span><strong>{moneyPerSqm(baseFinance.expectedSalePricePerSqm)}</strong></div>
          <div className="summary-row"><span>الإيرادات</span><strong>{money(baseFinance.revenue)}</strong></div>
          <div className="summary-row"><span>الربح</span><strong>{money(baseFinance.profit)}</strong></div>
          <div className="summary-row"><span>الربح على التكلفة</span><strong>{percent(baseFinance.profitOnCost)}</strong></div>
          <div className="summary-row"><span>هامش الربح من الإيرادات</span><strong>{percent(baseFinance.profitMargin)}</strong></div>
          <div className="summary-row"><span>سعر التعادل</span><strong>{moneyPerSqm(baseFinance.breakEvenSalePricePerSqm)}</strong></div>
        </div>
        {baseFinance.revenue === null ? (
          <div className="notice" style={{ marginTop: 18 }}>
            <Info size={16} />
            <span>لم يدخل المستخدم سعراً متوقعاً صالحاً أو مساحة قابلة للبيع. لن تظهر إيرادات أو أرباح وهمية، بينما تبقى تكلفة التطوير وإجمالي الاستثمار وأسعار الأهداف متاحة عند توفر المساحة.</span>
          </div>
        ) : null}
        <h3 style={{ margin: '24px 0 10px', fontSize: 15 }}>أسعار أهداف الربح على التكلفة</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>السيناريو</th><th>الهدف</th><th>الإيراد المطلوب</th><th>سعر المتر</th></tr></thead>
            <tbody>
              {targetRows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{formatNumber(row.targetProfitOnCost)}٪</td><td>{money(row.requiredRevenue)}</td><td>{moneyPerSqm(row.requiredSalePricePerSqm)}</td></tr>)}
            </tbody>
          </table>
        </div>
        {baseFinance.salesScenarios.length ? (
          <>
            <h3 style={{ margin: '24px 0 10px', fontSize: 15 }}>سيناريوهات حساسية سعر البيع</h3>
            <p className="section-note">سيناريوهات رياضية حول السعر المدخل، وليست توقعات سوقية.</p>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>السيناريو</th><th>سعر المتر</th><th>الإيراد</th><th>الربح</th><th>على التكلفة</th><th>الهامش</th></tr></thead>
                <tbody>
                  {baseFinance.salesScenarios.map((row) => <tr key={row.label}><td>{row.label} ({formatNumber(row.adjustment)}٪)</td><td>{moneyPerSqm(row.salePricePerSqm)}</td><td>{formatSAR(row.revenue)}</td><td>{formatSAR(row.profit)}</td><td>{percent(row.profitOnCost)}</td><td>{percent(row.profitMargin)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
        <div className="what-if-card">
          <div className="section-divider"><span>What‑If — زيادة تكلفة البناء</span></div>
          <p className="section-note">تعديل مشتق مؤقت من 0٪ إلى 25٪. لا يغيّر مدخلات الأرض أو سعر البيع أو المساحة القابلة للبيع.</p>
          <div className="range-row">
            <input type="range" min="0" max="25" step="1" value={whatIfAdjustment} onChange={(event) => setWhatIfAdjustment(Number(event.target.value))} data-testid="input-what-if-construction" />
            <strong>{formatNumber(whatIfAdjustment)}٪</strong>
            <button type="button" className="ghost-button button-small" onClick={() => setWhatIfAdjustment(0)} data-testid="button-reset-what-if">الحالة الأساسية</button>
          </div>
          <div className="summary-list">
            <div className="summary-row"><span>إجمالي الاستثمار</span><strong>{formatSAR(whatIfFinance.totalInvestment)} <small>{whatIfAdjustment ? `(الأساس ${formatSAR(baseFinance.totalInvestment)})` : ''}</small></strong></div>
            <div className="summary-row"><span>تكلفة التطوير / م²</span><strong>{moneyPerSqm(whatIfFinance.developmentCostPerSqm)}</strong></div>
            <div className="summary-row"><span>الربح</span><strong>{money(whatIfFinance.profit)}</strong></div>
            <div className="summary-row"><span>الربح على التكلفة</span><strong>{percent(whatIfFinance.profitOnCost)}</strong></div>
            <div className="summary-row"><span>هامش الربح</span><strong>{percent(whatIfFinance.profitMargin)}</strong></div>
            <div className="summary-row"><span>سعر التعادل</span><strong>{moneyPerSqm(whatIfFinance.breakEvenSalePricePerSqm)}</strong></div>
            <div className="summary-row"><span>سعر هدف {formatNumber(whatIfFinance.targetProfitRate)}٪</span><strong>{moneyPerSqm(whatIfFinance.targetProfitSalePricePerSqm)}</strong></div>
          </div>
        </div>
        {!costs.costsValid ? <div className="notice" style={{ marginTop: 18 }}><Info size={16} /><span>تحتاج بعض مدخلات التكلفة إلى مراجعة: {costs.validationMessages.join('، ')}</span></div> : null}
        {baseFinance.validationMessages.length ? <div className="notice" style={{ marginTop: 18 }}><Info size={16} /><span>{baseFinance.validationMessages.join('، ')}</span></div> : null}
        <div className="notice" style={{ marginTop: 18 }}>
          <Info size={16} />
          <span>{snapshot.notes[0]} {snapshot.notes[1]} {snapshot.notes[2]} هذا مؤشر أولي مبني على الافتراضات المدخلة وليس توصية استثمارية.</span>
        </div>
      </div>
      <div className="completion-card">
        <div className={`feasibility-card feasibility-card--${baseFinance.feasibility.state}`}>
          <div className="placeholder-icon" style={{ background: 'rgba(112,225,211,.15)', color: '#8ce9db' }}><ShieldCheck size={22} /></div>
          <h2>{baseFinance.feasibility.label}</h2>
          <p>{baseFinance.feasibility.reason}</p>
          <div className="completion-bar"><span /></div>
          <div className="completion-meta"><span>الربح على التكلفة</span><span>{percent(baseFinance.profitOnCost)}</span></div>
        </div>
        <div className="summary-list summary-list--dark">
          <div className="summary-row"><span>قيمة الأرض</span><strong>{formatSAR(baseFinance.landValue)}</strong></div>
          <div className="summary-row"><span>التطوير دون الأرض</span><strong>{formatSAR(baseFinance.developmentCostWithoutLand)}</strong></div>
          <div className="summary-row"><span>إجمالي الاستثمار</span><strong>{formatSAR(baseFinance.totalInvestment)}</strong></div>
          <div className="summary-row"><span>سعر التعادل</span><strong>{moneyPerSqm(baseFinance.breakEvenSalePricePerSqm)}</strong></div>
          <div className="summary-row"><span>هدف ٢٠٪</span><strong>{moneyPerSqm(targetRows[2]?.requiredSalePricePerSqm ?? null)}</strong></div>
        </div>
        <div className="metric-empty" style={{ borderColor: 'rgba(236,255,251,.2)', color: 'rgba(236,255,251,.68)' }}>
          <span><CircleHelp size={20} /></span>
          حدود المؤشر الافتراضية: إيجابي عند ربح على التكلفة ٢٠٪ فأعلى، ومراجعة بين ٠٪ وأقل من ٢٠٪، وغير مجدٍ عند السلبية.
        </div>
      </div>
    </div>
  );
}

function DraftDrawer({
  projects,
  currentProjectId,
  onClose,
  onOpen,
  onDuplicate,
  onDelete,
  onNew,
}: {
  projects: FeasibilityProject[];
  currentProjectId: string;
  onClose: () => void;
  onOpen: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="draft-drawer-backdrop" onClick={onClose}>
      <aside className="draft-drawer" onClick={(event) => event.stopPropagation()} aria-label="المسودات المحفوظة">
        <div className="drawer-heading">
          <div>
            <h2>الدراسات المحفوظة</h2>
            <span className="drawer-subtitle">{projects.length} دراسة محفوظة محلياً</span>
          </div>
          <button type="button" className="icon-button" onClick={onClose} data-testid="button-close-drafts" aria-label="إغلاق المسودات"><X size={17} /></button>
        </div>
        <button type="button" className="secondary-button button-wide" onClick={onNew} data-testid="button-new-saved-project">
          <Plus size={15} /> إنشاء دراسة جديدة
        </button>
        {projects.length ? (
          <div className="projects-list">
            {projects
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((savedProject) => {
                const savedFinance = calculateProjectSnapshot(savedProject).finance;
                const isCurrent = savedProject.id === currentProjectId;
                return (
                  <div className={`draft-card ${isCurrent ? 'draft-card--current' : ''}`} key={savedProject.id} data-testid={`card-saved-project-${savedProject.id}`}>
                    <div className="draft-card__topline">
                      <h3>{savedProject.name}</h3>
                      {isCurrent ? <span className="project-badge">الحالية</span> : null}
                    </div>
                    <p>{savedProject.region} · {savedProject.city || 'مدينة غير محددة'}{savedProject.district ? ` · ${savedProject.district}` : ''}</p>
                    <p>{savedProject.type} · {formatNumber(savedProject.landArea)} م² أرض · آخر تحديث {new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(new Date(savedProject.updatedAt))}</p>
                    <div className="draft-card__metric"><span>إجمالي الاستثمار</span><strong>{formatSAR(savedFinance.totalInvestment)}</strong></div>
                    <div className="draft-card__footer">
                      <button type="button" className="primary-button button-small" onClick={() => onOpen(savedProject.id)} data-testid={`button-open-project-${savedProject.id}`}>
                        <FolderOpen size={14} /> فتح
                      </button>
                      <button type="button" className="ghost-button button-small" onClick={() => onDuplicate(savedProject.id)} data-testid={`button-duplicate-project-${savedProject.id}`}>
                        <Copy size={14} /> نسخ
                      </button>
                      <button
                        type="button"
                        className="danger-button button-small"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذه الدراسة؟ لا يمكن التراجع عن هذا الإجراء.')) onDelete(savedProject.id);
                        }}
                        data-testid={`button-delete-project-${savedProject.id}`}
                      >
                        <Trash2 size={14} /> حذف
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="empty-draft">
            <FolderOpen size={28} />
            لا توجد دراسات محفوظة بعد.<br />سيظهر المشروع هنا بعد أول حفظ.
          </div>
        )}
        <div className="notice" style={{ marginTop: 24 }}>
          <CloudOff size={16} />
          <span>الحفظ محلي فقط، ولا يتم إرسال أي بيانات إلى خادم خارجي.</span>
        </div>
      </aside>
    </div>
  );
}

function CompanySettingsDrawer({
  settings,
  onClose,
  onSave,
}: {
  settings: CompanySettings;
  onClose: () => void;
  onSave: (settings: CompanySettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [logoError, setLogoError] = useState('');

  const update = (patch: Partial<CompanySettings>) => setDraft((current) => ({ ...current, ...patch }));

  const readLogo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('اختر ملف صورة صالحاً.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('حجم الشعار يجب ألا يتجاوز 2 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoError('');
      update({ logoDataUrl: typeof reader.result === 'string' ? reader.result : '' });
    };
    reader.onerror = () => setLogoError('تعذر قراءة ملف الشعار.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="draft-drawer-backdrop" onClick={onClose}>
      <aside className="draft-drawer settings-drawer" onClick={(event) => event.stopPropagation()} aria-label="إعدادات الشركة والتقرير">
        <div className="drawer-heading">
          <div>
            <h2>إعدادات الشركة والتقرير</h2>
            <span className="drawer-subtitle">تُحفظ محلياً وتظهر في التقرير فقط</span>
          </div>
          <button type="button" className="icon-button" onClick={onClose} data-testid="button-close-company-settings" aria-label="إغلاق الإعدادات"><X size={17} /></button>
        </div>
        <div className="settings-form">
          <Field label="اسم الشركة / المنشأة">
            <input value={draft.companyName} onChange={(event) => update({ companyName: event.target.value })} data-testid="input-company-name" />
          </Field>
          <Field label="عنوان التقرير">
            <input value={draft.reportTitle} onChange={(event) => update({ reportTitle: event.target.value })} data-testid="input-report-title" />
          </Field>
          <Field label="الهاتف">
            <input value={draft.phone} onChange={(event) => update({ phone: event.target.value })} inputMode="tel" data-testid="input-company-phone" />
          </Field>
          <Field label="البريد الإلكتروني">
            <input value={draft.email} onChange={(event) => update({ email: event.target.value })} type="email" data-testid="input-company-email" />
          </Field>
          <Field label="العنوان" full>
            <input value={draft.address} onChange={(event) => update({ address: event.target.value })} data-testid="input-company-address" />
          </Field>
          <Field label="السجل التجاري — اختياري">
            <input value={draft.commercialRegistration} onChange={(event) => update({ commercialRegistration: event.target.value })} data-testid="input-company-cr" />
          </Field>
          <Field label="الرقم الضريبي — اختياري">
            <input value={draft.taxNumber} onChange={(event) => update({ taxNumber: event.target.value })} data-testid="input-company-tax" />
          </Field>
          <Field label="ملاحظة ختامية — اختياري" full>
            <textarea value={draft.footerNote} onChange={(event) => update({ footerNote: event.target.value })} rows={3} data-testid="input-company-footer-note" />
          </Field>
          <div className="logo-upload-card">
            <div className="logo-upload-card__preview">
              {draft.logoDataUrl ? <img src={draft.logoDataUrl} alt="معاينة الشعار" /> : <ImagePlus size={22} />}
            </div>
            <div>
              <strong>شعار التقرير</strong>
              <span>PNG أو JPG أو WebP، حتى 2 ميجابايت، ولا يتم رفعه خارج الجهاز.</span>
              <div className="button-row" style={{ marginTop: 8 }}>
                <label className="secondary-button button-small upload-label">
                  <ImagePlus size={14} /> {draft.logoDataUrl ? 'استبدال الشعار' : 'اختيار شعار'}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => readLogo(event.target.files?.[0])} data-testid="input-company-logo" />
                </label>
                {draft.logoDataUrl ? <button type="button" className="danger-button button-small" onClick={() => update({ logoDataUrl: '' })} data-testid="button-remove-company-logo"><Trash2 size={14} /> إزالة</button> : null}
              </div>
              {logoError ? <span className="field-error">{logoError}</span> : null}
            </div>
          </div>
        </div>
        <div className="drawer-actions">
          <button type="button" className="primary-button button-wide" onClick={() => { onSave(draft); onClose(); }} data-testid="button-save-company-settings">
            <Save size={15} /> حفظ إعدادات التقرير
          </button>
          <button type="button" className="subtle-link" onClick={onClose}>إلغاء</button>
        </div>
      </aside>
    </div>
  );
}

export default App;