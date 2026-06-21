/** Shared Tailwind utilities — use in templates instead of styles-fixify.css classes. */

export const tw = {

  // Animations

  u: 'animate-[up_0.35s_cubic-bezier(0.4,0,0.2,1)_both]',

  u1: 'animate-[up_0.35s_cubic-bezier(0.4,0,0.2,1)_0.05s_both]',

  u2: 'animate-[up_0.35s_cubic-bezier(0.4,0,0.2,1)_0.1s_both]',

  u3: 'animate-[up_0.35s_cubic-bezier(0.4,0,0.2,1)_0.15s_both]',

  u4: 'animate-[up_0.35s_cubic-bezier(0.4,0,0.2,1)_0.2s_both]',

  spin: 'animate-[spin_0.8s_linear_infinite]',



  // App shell

  app: 'grid h-screen min-h-screen grid-cols-[220px_1fr] overflow-hidden',

  mainCol: 'flex h-screen min-h-screen flex-col overflow-hidden',

  content: 'flex-1 overflow-y-auto px-7 py-6',



  // Sidebar

  sidebar:

    'z-10 flex h-screen min-h-screen shrink-0 flex-col overflow-hidden border-r border-fixify-border bg-white shadow-[2px_0_12px_rgba(13,30,61,0.04)]',

  sidebarTop: 'shrink-0',

  sidebarNav: 'min-h-0 flex-1 overflow-y-auto pb-2',

  sidebarFooter:

    'mt-auto shrink-0 border-t border-fixify-border-soft px-2.5 pb-3.5 pt-2.5',

  sidebarSec: 'px-2.5 pb-2',

  sidebarLbl:

    'px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.7px] text-fixify-text-3',

  sidebarSelect:

    'w-full cursor-pointer rounded-lg border border-fixify-border bg-fixify-surface-2 px-2.5 py-2 text-[13px] text-fixify-text-2 outline-none',

  sidebarUserName:

    'overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-fixify-text-1',

  sidebarUserSub: 'text-[11px] text-fixify-text-3',

  sidebarLogout: 'mt-2 w-full justify-center text-[12.5px]',



  // Logo

  logo: 'mb-1 flex items-center gap-2.5 border-b border-fixify-border-soft px-4 pb-3 pt-4',

  logoIcon:

    'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent',

  logoIconLg: 'h-10 w-10',

  logoText:
    'text-[17px] font-bold tracking-[-0.4px] text-fixify-text-1',

  // Nav
  nav: 'relative flex w-full max-w-full cursor-pointer select-none items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium text-fixify-text-2 transition hover:bg-fixify-accent-soft hover:text-fixify-accent',
  navActive:
    'bg-fixify-accent-light font-semibold text-fixify-accent before:absolute before:-left-2.5 before:top-[22%] before:h-[56%] before:w-[3px] before:rounded-r before:bg-fixify-accent before:content-[\'\']',

  navWp:

    'mt-1 border border-dashed border-fixify-accent-mid bg-fixify-accent-soft',

  navWpActive: 'border-solid',

  navCount:
    'ml-auto shrink-0 rounded-full px-[7px] py-0.5 text-[10px] font-bold',

  navCountPrimary: 'bg-fixify-accent-light text-fixify-accent',

  navCountRed: 'bg-fixify-error-soft text-fixify-error',

  navCountWarn: 'bg-fixify-warning-soft text-fixify-warning',

  sidebarUser:
    'flex items-center gap-2.5 rounded-[10px] px-2.5 py-2',



  // Topbar

  topbar:

    'flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-fixify-border bg-white px-6',

  topbarTitle: 'text-[15px] font-bold text-fixify-text-1',

  topbarSiteBadge:

    'inline-flex items-center gap-[5px] rounded-lg border border-fixify-border bg-fixify-surface-2 px-2.5 py-[3px] text-xs text-fixify-text-3',

  topbarSiteDot: 'inline-block h-[7px] w-[7px] rounded-full',

  topbarScanning:

    'inline-flex items-center gap-1.5 text-xs font-medium text-fixify-accent',

  topbarBell:

    'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-fixify-border bg-fixify-surface-2',

  topbarBellDot:

    'absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-fixify-error',



  // Layout grids

  grid2: 'grid grid-cols-1 gap-[18px] sm:grid-cols-2',

  grid3: 'grid grid-cols-1 gap-[18px] sm:grid-cols-3',

  grid4: 'grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4',

  /** Vertical rhythm between major page blocks (stats, grids, sections). */
  pageBody: 'flex flex-col gap-[22px]',

  /** Section with heading + content. */
  pageSection: 'flex flex-col',



  // Page header

  pageHeader: 'mb-[22px]',

  pageTitle:

    'text-[22px] font-bold leading-tight tracking-[-0.4px] text-fixify-text-1',

  pageSub: 'mt-1 text-[13px] text-fixify-text-3',

  sectionHead: 'mb-3.5 flex items-center justify-between',

  sectionTitle: 'text-[15px] font-bold text-fixify-text-1',



  // Cards

  card: 'rounded-[14px] border border-fixify-border bg-white shadow-[0_1px_4px_rgba(13,30,61,0.07)] transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',

  cardHover:

    'hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(13,30,61,0.09),0_2px_5px_rgba(13,30,61,0.05)]',

  cardPad: 'p-5 sm:px-[22px] sm:py-5',

  cardStatic: 'hover:translate-y-0 hover:shadow-[0_1px_4px_rgba(13,30,61,0.07)]',

  statCard:

    'rounded-[14px] border border-fixify-border bg-white p-[18px_20px] shadow-[0_1px_4px_rgba(13,30,61,0.07)]',



  // Form

  field: 'mb-3.5 flex flex-col gap-1.5',

  fld: 'mb-3.5 flex flex-col gap-[5px]',

  label: 'text-xs font-semibold text-fixify-text-2',

  input:

    'w-full rounded-[9px] border border-fixify-border bg-fixify-surface-2 px-3 py-2.5 text-[13.5px] text-fixify-text-1 outline-none transition placeholder:text-fixify-text-3 focus:border-fixify-accent focus:bg-white focus:shadow-[0_0_0_3px_rgba(29,111,224,0.1)] disabled:opacity-60',

  inputError:

    'border-fixify-error bg-fixify-error-soft focus:border-fixify-error focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]',

  fieldError: 'mt-0.5 text-xs text-fixify-error',

  passwordWrap: 'relative',

  passwordToggle:

    'absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-fixify-text-3 hover:bg-fixify-surface-2',



  // Buttons

  btn: 'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border-none px-4 py-2 text-[13.5px] font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-60',

  btnPrimary:

    'bg-fixify-accent text-white shadow-[0_2px_8px_rgba(29,111,224,0.3)] hover:bg-fixify-accent-dark hover:shadow-[0_4px_14px_rgba(29,111,224,0.4)] active:translate-y-0 hover:-translate-y-px',

  btnGhost:

    'border border-fixify-border bg-transparent text-fixify-text-2 hover:border-fixify-accent-mid hover:bg-fixify-accent-soft hover:text-fixify-accent',

  btnDanger:

    'border border-red-300 bg-fixify-error-soft text-fixify-error hover:bg-red-100',

  btnSm: 'px-3 py-[5px] text-[12.5px]',

  btnFull: 'mt-2 w-full py-2.5',



  // Search

  search:

    'flex max-w-[360px] flex-1 items-center gap-2 rounded-[10px] border border-fixify-border bg-fixify-surface-2 px-3 py-[7px]',

  searchInput:

    'w-full border-none bg-transparent text-[13.5px] text-fixify-text-1 outline-none placeholder:text-fixify-text-3',



  // Table

  table: 'fx-table w-full border-collapse text-[13.5px]',

  th: 'border-b border-fixify-border bg-fixify-surface-2 px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-fixify-text-3',

  td: 'border-b border-fixify-border-soft px-3.5 py-3 align-middle text-fixify-text-2',

  trLast: '[&_td]:border-b-0',

  trHover: '[&_tr:hover_td]:bg-fixify-accent-soft',



  // Tabs

  tabs: 'mb-[22px] flex gap-0.5 border-b border-fixify-border',

  tab: 'mb-[-1px] cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-[13.5px] font-medium text-fixify-text-3 transition hover:text-fixify-text-2',

  tabActive:

    'border-b-fixify-accent font-semibold text-fixify-accent',



  // Stats

  statVal: 'text-[30px] font-bold leading-none tracking-[-1px] text-fixify-text-1',

  statSub: 'mt-1 text-xs text-fixify-text-3',

  statLbl:

    'mb-2 flex items-center gap-1.5 text-xs font-medium text-fixify-text-3',



  // Progress

  prog: 'h-1.5 w-full overflow-hidden rounded-full bg-fixify-border',

  progb: 'h-full rounded-full transition-[width] duration-1000 ease-out',



  // Filters

  fltBar: 'mb-4 flex flex-wrap gap-1.5',

  fltChip:

    'cursor-pointer rounded-full border border-fixify-border bg-white px-[13px] py-[5px] text-xs font-semibold text-fixify-text-2 transition hover:bg-fixify-accent-soft hover:text-fixify-accent',

  fltChipActive:

    'border-fixify-accent-mid bg-fixify-accent-light text-fixify-accent',



  // Toggle

  tog: 'relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-full transition-colors duration-200',

  togOn: 'bg-fixify-accent',

  togOff: 'bg-fixify-border',

  togKnob:

    'absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200',

  togKnobOn: 'translate-x-4',



  // Toast

  toastWrap:
    'fixed top-6 right-6 z-[1000] flex flex-col gap-2',

  toast:

    'flex min-w-[280px] max-w-[380px] animate-[toastIn_0.3s_cubic-bezier(0.4,0,0.2,1)] items-center gap-2.5 rounded-xl px-4 py-3 text-[13.5px] font-medium text-white shadow-[0_8px_24px_rgba(13,30,61,0.18)]',

  toastSuccess: 'border-l-[3px] border-l-fixify-success bg-[#064e3b]',

  toastError: 'border-l-[3px] border-l-fixify-error bg-[#7f1d1d]',

  toastInfo: 'border-l-[3px] border-l-fixify-accent bg-[#1e3a5f]',

  toastWarn: 'border-l-[3px] border-l-fixify-warning bg-[#713f12]',



  // Skeleton

  skelCell:

    'h-3.5 animate-[skel-shimmer_1.2s_ease-in-out_infinite] rounded-md bg-[linear-gradient(90deg,var(--color-fixify-surface-2)_25%,var(--color-fixify-border-soft)_50%,var(--color-fixify-surface-2)_75%)] bg-[length:200%_100%]',



  // Modal

  overlay:

    'fixed inset-0 z-[500] flex animate-[fadeIn_0.2s_ease] items-center justify-center bg-[rgba(13,30,61,0.45)] p-5 backdrop-blur-[2px]',

  modal:

    'max-h-[90vh] w-full max-w-[520px] animate-[slideUp_0.25s_ease] overflow-y-auto rounded-[18px] bg-white shadow-[0_20px_60px_rgba(13,30,61,0.2)]',

  modalLg: 'max-w-[720px]',

  modalHeader:

    'flex items-center justify-between border-b border-fixify-border px-6 pb-4 pt-[22px]',

  modalTitle: 'text-base font-bold text-fixify-text-1',

  modalBody: 'px-6 py-5',

  modalFooter:

    'flex justify-end gap-2.5 border-t border-fixify-border px-6 py-4',

  closeBtn:

    'flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg text-fixify-text-3 transition hover:bg-fixify-border-soft hover:text-fixify-text-1',

  iconBadge:

    'flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-fixify-accent-light',



  // Auth

  authPage:

    'flex min-h-screen items-center justify-center bg-fixify-bg p-6',

  authCard:

    'w-full max-w-[420px] rounded-[18px] border border-fixify-border bg-white p-8 shadow-[0_4px_16px_rgba(13,30,61,0.09)] sm:px-9',

  authBrand: 'mb-6 flex items-center gap-3',

  authSub: 'mt-0.5 text-[13px] text-fixify-text-3',

  authHeading: 'mb-1.5 text-[22px] font-bold text-fixify-text-1',

  authHint: 'mb-5 text-[13.5px] text-fixify-text-3',

  authForm: 'flex flex-col gap-1',

  authError: 'my-1 text-[13px] text-fixify-error',

  authSuccess: 'my-1 text-[13px] text-fixify-success',

  authLink:

    'text-xs font-medium text-fixify-accent no-underline hover:underline',

  authBack:

    'mb-4 inline-flex items-center gap-1 text-[13px] text-fixify-text-3 no-underline hover:text-fixify-accent',



  // Profile

  profileGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6',

  profileLabel:

    'text-[11px] font-semibold uppercase tracking-wide text-fixify-text-3',

  profileValue: 'break-words text-sm font-medium text-fixify-text-1',

  avatar:

    'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fixify-accent to-sky-400 text-xs font-bold text-white',

  avatarLg: 'h-14 w-14 text-lg',



  // Admin tabs & detail

  adminTabs:

    'mb-[18px] flex gap-1 border-b border-fixify-border pb-0',

  adminTab:

    'mb-[-1px] inline-flex cursor-pointer items-center gap-1.5 border-b-2 border-transparent bg-transparent px-4 py-2.5 text-[13px] font-medium text-fixify-text-3 transition hover:text-fixify-text-2',

  adminTabActive:

    'border-b-fixify-accent font-semibold text-fixify-accent',

  adminTabBadge:

    'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-fixify-warning px-[5px] text-[10px] font-bold text-white',

  adminPlanPill:

    'inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-bold whitespace-nowrap',

  adminDetailHeader:

    'mt-3.5 flex flex-wrap items-start gap-4',

  adminDetailAvatar:

    'flex h-14 w-14 items-center justify-center rounded-[14px] text-lg font-bold',

  adminBackBtn: 'mb-1',

  adminInfoGrid:

    'grid grid-cols-1 gap-3 text-[13px] text-fixify-text-2 sm:grid-cols-2 sm:gap-x-5',

  adminInfoLabel:

    'mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-fixify-text-3',

  adminInlineSelect: 'min-w-[160px] px-2.5 py-1.5 text-[12.5px]',

  adminPlanCard: 'p-5',

  adminCheckRow:

    'flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-fixify-border bg-fixify-surface-2 px-3.5 py-3 text-[13px] text-fixify-text-2 [&_input]:mt-0.5 [&_input]:accent-fixify-accent',

  adminDashPreview:

    'rounded-[14px] border border-fixify-border bg-white p-[18px]',

  adminDashPreviewBanner:

    'mb-[18px] flex items-center gap-2 rounded-[10px] border border-fixify-accent-mid bg-fixify-accent-soft px-3.5 py-2.5 text-[12.5px] font-medium text-fixify-accent',

  wpActionGrid:

    'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3',

  wpActionBtn: 'w-full justify-start gap-2',



  // WordPress flow

  wpSteps: 'mb-[22px] flex w-full items-center gap-0',

  wpPage: 'w-full',

  wpFormCard: 'w-full max-w-none hover:translate-y-0',

  wpStep:

    'flex items-center gap-2 whitespace-nowrap text-[13px] font-medium text-fixify-text-3',

  wpStepOn: 'text-fixify-text-2 [&_.wp-step-num]:border-fixify-accent [&_.wp-step-num]:text-fixify-accent',

  wpStepActive:

    'font-semibold text-fixify-accent [&_.wp-step-num]:border-fixify-accent [&_.wp-step-num]:bg-fixify-accent [&_.wp-step-num]:text-white',

  wpStepNum:

    'wp-step-num flex h-7 w-7 items-center justify-center rounded-full border-2 border-fixify-border bg-white text-xs font-bold',

  wpStepLine: 'mx-2.5 h-0.5 min-w-6 flex-1 bg-fixify-border',

  wpStepLineOn: 'bg-fixify-accent',

  wpToggleRow:

    'flex items-center justify-between border-b border-fixify-border-soft py-3',

  wpSummary:

    'rounded-xl border border-fixify-accent-mid bg-fixify-accent-soft px-[18px] py-4',

  wpSummaryGrid:

    'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-5',

  wpSummaryItem: 'flex flex-col gap-[3px]',

  wpSummaryLabel:

    'text-[11px] font-semibold uppercase tracking-wide text-fixify-text-3',

  wpSummaryValue:

    'break-all text-[13px] font-medium text-fixify-text-1',

  wpSummaryValueMono:

    'font-mono text-xs text-fixify-text-2',

  wpMono: 'font-mono text-[12.5px] text-fixify-text-2',

  wpPasswordWrap: 'relative flex items-center',

  wpPasswordToggle:

    'absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 hover:bg-fixify-border-soft',



  // WordPress hub

  wpManageHub: 'flex flex-col gap-0',

  wpManageToolbar:

    'mb-[18px] flex flex-wrap items-center justify-between gap-4 max-[760px]:flex-col max-[760px]:items-stretch',

  wpManageToolbarMain:

    'flex min-w-0 flex-1 flex-wrap items-end gap-3.5',

  wpManageSelectWrap: 'mb-0! min-w-[220px] max-w-[300px] flex-1 max-[760px]:max-w-none',

  wpManageMeta:

    'flex flex-wrap items-center gap-2 pb-px',



  // Site manage

  smHero: 'mt-3.5 hover:translate-y-0 hover:shadow-[0_1px_4px_rgba(13,30,61,0.07)]',

  smHeader: 'flex flex-wrap items-center gap-4',

  smHeaderMain: 'min-w-0 flex-1',

  smTitleRow:

    'mb-2 flex flex-wrap items-baseline gap-2.5',

  smCustomer: 'text-[13px] font-medium text-fixify-text-3',

  smMeta: 'flex flex-wrap items-center gap-2',

  smLayout:

    'grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[220px_1fr]',

  smNav:

    'sticky top-0 flex flex-col gap-0.5 overflow-hidden p-2.5!',

  smNavLbl:

    'px-2.5 pb-2 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.7px] text-fixify-text-3',

  smNavItem:

    'relative flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium text-fixify-text-2 no-underline transition hover:bg-fixify-accent-soft hover:text-fixify-accent',

  smNavActive:

    'bg-fixify-accent-light font-semibold text-fixify-accent before:absolute before:left-0 before:top-[22%] before:h-[56%] before:w-[3px] before:rounded-r before:bg-fixify-accent before:content-[\'\']',

  smContent: 'min-w-0',

  smPanel: 'hover:translate-y-0 hover:shadow-[0_1px_4px_rgba(13,30,61,0.07)]',

  smPage: 'flex flex-col gap-0',

  smPageHd:

    'mb-[18px] flex flex-wrap items-start justify-between gap-4',

  smCardGrid:

    'grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3',

  smCard:

    'flex min-h-[148px] flex-col gap-2 rounded-[14px] p-[18px_20px] no-underline text-inherit transition hover:-translate-y-0.5 hover:border-fixify-accent-mid hover:shadow-[0_4px_16px_rgba(13,30,61,0.09),0_2px_5px_rgba(13,30,61,0.05)]',

  smCardTop: 'flex items-start justify-between gap-2',

  smCardIcon:

    'flex h-10 w-10 items-center justify-center rounded-[10px] bg-fixify-accent-soft shadow-[inset_0_0_0_1px_var(--color-fixify-accent-mid)]',

  smCardTitle: 'text-sm font-bold text-fixify-text-1',

  smCardDesc: 'flex-1 text-[12.5px] leading-[1.55] text-fixify-text-3',

  smCardLink:

    'mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-fixify-accent',

  smUpgradeFlow:

    'flex items-center gap-3 max-[640px]:flex-col max-[640px]:items-stretch',

  smVersionCol:

    'flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-fixify-border-soft bg-fixify-surface-2 p-4',

  smVersionTarget: 'border-[#bbf7d0] bg-fixify-success-soft',

  smVersionNum:

    'font-mono text-[26px] font-bold leading-none tracking-[-0.5px] text-fixify-text-1',

  smVersionNumAcc: 'text-fixify-success',

  smVersionBridge:

    'relative flex w-12 shrink-0 items-center gap-0 max-[640px]:w-full max-[640px]:justify-center max-[640px]:py-1',

  smVersionBridgeLine: 'h-0.5 flex-1 bg-fixify-border',

  smVersionBridgeIcon:

    'z-[1] -mx-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fixify-accent-mid bg-white',

  smChangelog: 'm-0 flex list-none flex-col gap-2.5 p-0',

  smChangelogItem:

    'flex items-start gap-2.5 text-[13.5px] leading-normal text-fixify-text-2',

  smChecklist: 'flex flex-col gap-2',

  smCheckDone:

    'cursor-default! border-fixify-border-soft! bg-white!',

  smActionBar: 'flex items-center gap-2.5 pt-1',

  smSuccessState: 'px-6! py-9! text-center',

  smSuccessIcon:

    'mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#bbf7d0] bg-fixify-success-soft',

  smSuccessTitle: 'mb-1.5 text-base font-bold text-fixify-text-1',

  smSuccessSub: 'text-[13px] text-fixify-text-3',

  smActionIcon:

    'flex h-11 w-11 items-center justify-center rounded-xl bg-fixify-accent-soft shadow-[inset_0_0_0_1px_var(--color-fixify-accent-mid)]',

  smBusy:

    'mb-3 flex items-center gap-2 rounded-[10px] border border-fixify-accent-mid bg-fixify-accent-soft px-3.5 py-2.5 text-[13px] font-medium text-fixify-accent',

  smRowSelected: '[&>td]:bg-fixify-accent-soft',

  smAlert:

    'flex items-center gap-2 rounded-[10px] border border-red-300 bg-fixify-error-soft px-3.5 py-2.5 text-[12.5px] font-medium text-fixify-error',



  // Mode toggle (admin/customer preview)

  modeToggle:

    'mx-2.5 mb-1 mt-2 flex gap-0.5 rounded-[9px] bg-fixify-border-soft p-[3px]',

  modeBtn:

    'flex-1 cursor-pointer rounded-[7px] px-1.5 py-1.5 text-center text-[11.5px] font-semibold text-fixify-text-3 transition',

  modeBtnActive:

    'bg-white text-fixify-text-1 shadow-[0_1px_4px_rgba(13,30,61,0.07),0_1px_2px_rgba(13,30,61,0.04)]',

} as const;

