"use client";

import * as React from "react";
import {
  Button,
  Drawer,
  Input,
  ScrollShadow,
  Separator,
  Skeleton,
  Tooltip,
} from "@heroui/react";

/* Util & konstanta */
type ClassValue = string | false | null | undefined;

function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const MOBILE_BREAKPOINT = 768;

function PanelLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

/*  Context & hooks */

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
  openMobile: boolean;
  setOpenMobile: (value: React.SetStateAction<boolean>) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar harus dipakai di dalam <SidebarProvider />.");
  }
  return context;
}

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/*  SidebarProvider */

export type SidebarProviderProps = React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [openInternal, setOpenInternal] = React.useState(defaultOpen);

  const open = openProp ?? openInternal;

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(open) : value;
      if (openProp === undefined) setOpenInternal(next);
      onOpenChange?.(next);
    },
    [open, openProp, onOpenChange],
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((o) => !o) : setOpen((o) => !o);
  }, [isMobile, setOpen]);

  // Shortcut: Cmd+B (Mac) / Ctrl+B (Windows)
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar]);

  const state: SidebarContextProps["state"] = open ? "expanded" : "collapsed";

  const value = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-surface",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

/*  Sidebar */
export type SidebarProps = React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  // Tidak bisa di-collapse
  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-surface text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Mobile -> Drawer HeroUI v3
  if (isMobile) {
    return (
      <Drawer>
        <Drawer.Backdrop isOpen={openMobile} onOpenChange={setOpenMobile}>
          <Drawer.Content placement={side}>
            <Drawer.Dialog
              aria-label="Sidebar"
              data-slot="sidebar"
              data-sidebar="sidebar"
              data-mobile="true"
              className="h-full w-72 max-w-[85vw] rounded-none p-0"
            >
              <div className="flex h-full w-full flex-col bg-surface text-foreground">
                {children}
              </div>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    );
  }

  // Desktop
  return (
    <div
      data-slot="sidebar"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      className="group peer hidden text-foreground md:block"
    >
      {/* Spacer: menjaga lebar di layout flex */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative h-svh w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          "group-data-[variant=floating]:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]",
          "group-data-[variant=inset]:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]",
        )}
      />

      {/* Panel sidebar (fixed) */}
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-30 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          "group-data-[side=left]:left-0 group-data-[side=right]:right-0",
          "group-data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]",
          "group-data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          "group-data-[variant=floating]:p-2 group-data-[variant=inset]:p-2",
          "group-data-[variant=floating]:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]",
          "group-data-[variant=inset]:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className={cn(
            "flex h-full w-full flex-col bg-surface",
            "group-data-[variant=sidebar]:border-border",
            "group-data-[variant=sidebar]:group-data-[side=left]:border-r",
            "group-data-[variant=sidebar]:group-data-[side=right]:border-l",
            "group-data-[variant=floating]:rounded-xl group-data-[variant=floating]:border group-data-[variant=floating]:border-border group-data-[variant=floating]:shadow-sm",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/*  Trigger, Rail, Inset */

export function SidebarTrigger({
  className,
  onPress,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-slot="sidebar-trigger"
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label="Toggle Sidebar"
      className={cn("size-7", className as string | undefined)}
      {...props}
      onPress={(event) => {
        onPress?.(event);
        toggleSidebar();
      }}
    >
      {children ?? <PanelLeftIcon className="size-4" />}
    </Button>
  );
}

export function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      title="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear md:flex",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border",
        "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
        "group-data-[side=left]:cursor-w-resize group-data-[side=right]:cursor-e-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "group-data-[side=left]:group-data-[collapsible=offcanvas]:-right-2",
        "group-data-[side=right]:group-data-[collapsible=offcanvas]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

/** Bungkus konten utama saat memakai variant="inset". */
export function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-h-svh w-full min-w-0 flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

/*  Header, Footer, Content, Separator, Input */

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollShadow>) {
  return (
    <ScrollShadow
      data-slot="sidebar-content"
      data-sidebar="content"
      hideScrollBar
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
        "group-data-[collapsible=icon]:overflow-hidden",
        className as string | undefined,
      )}
      {...props}
    >
      {children}
    </ScrollShadow>
  );
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      className={cn("mx-2 w-auto", className as string | undefined)}
      {...props}
    />
  );
}

export function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      variant="secondary"
      fullWidth
      className={cn("h-8 text-sm")}
      {...props}
    />
  );
}

/*  Collapsible (untuk group & submenu) */

type CollapsibleContextProps = {
  open: boolean;
  toggle: () => void;
  contentId: string;
};

const CollapsibleContext = React.createContext<CollapsibleContextProps | null>(null);

function useCollapsible() {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) throw new Error("Harus dipakai di dalam <SidebarCollapsible />.");
  return ctx;
}

export function SidebarCollapsible({
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openInternal, setOpenInternal] = React.useState(defaultOpen);
  const contentId = React.useId();
  const open = openProp ?? openInternal;

  const toggle = React.useCallback(() => {
    const next = !open;
    if (openProp === undefined) setOpenInternal(next);
    onOpenChange?.(next);
  }, [open, openProp, onOpenChange]);

  const value = React.useMemo(() => ({ open, toggle, contentId }), [open, toggle, contentId]);

  return (
    <CollapsibleContext.Provider value={value}>
      <div
        data-slot="sidebar-collapsible"
        data-state={open ? "open" : "closed"}
        className={cn("group/collapsible", className)}
        {...props}
      />
    </CollapsibleContext.Provider>
  );
}

/**
 * Tombol pemicu. Bisa dipakai langsung, atau lewat prop `as`:
 *   <SidebarGroupLabel as={SidebarCollapsibleTrigger}>
 *   <SidebarMenuButton as={SidebarCollapsibleTrigger}>
 */
export const SidebarCollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(function SidebarCollapsibleTrigger({ onClick, ...props }, ref) {
  const { open, toggle, contentId } = useCollapsible();

  return (
    <button
      ref={ref}
      type="button"
      data-slot="sidebar-collapsible-trigger"
      aria-expanded={open}
      aria-controls={contentId}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggle();
      }}
    />
  );
});

export function SidebarCollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, contentId } = useCollapsible();

  return (
    <div
      id={contentId}
      data-slot="sidebar-collapsible-content"
      data-state={open ? "open" : "closed"}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-linear",
        "data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]",
        className,
      )}
      {...props}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/*  Group */

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

export const SidebarGroupLabel = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"div"> & { as?: React.ElementType }
>(function SidebarGroupLabel({ as: Comp = "div", className, ...props }, ref) {
  return (
    <Comp
      ref={ref}
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-8 w-full shrink-0 items-center rounded-lg px-2 text-left text-xs font-medium text-muted outline-none",
        "transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 focus-visible:ring-focus",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
});

export function SidebarGroupAction({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-muted outline-none",
        "transition-colors hover:bg-default hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

/*  Menu */

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const menuButtonSize = {
  sm: "h-7 text-xs",
  md: "h-8 text-sm",
  lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
} as const;

/**
 * Class untuk tampilan "menu button". Dipakai SidebarMenuButton, dan bisa dipakai
 * langsung di elemen lain, mis. `<Dropdown.Trigger className={sidebarMenuButtonClassName({ size: "lg" })}>`.
 */
export function sidebarMenuButtonClassName({
  size = "md",
  variant = "default",
  className,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  className?: string;
} = {}) {
  return cn(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left outline-none",
    "transition-[width,height,padding,background-color,color] hover:bg-default focus-visible:ring-2 focus-visible:ring-focus active:bg-default/80",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "data-[active=true]:bg-accent-soft data-[active=true]:font-medium data-[active=true]:text-accent-soft-foreground",
    "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
    "[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    variant === "outline" && "border border-border bg-surface hover:bg-default",
    menuButtonSize[size],
    className,
  );
}

export type SidebarMenuButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  /** Render sebagai elemen lain, mis. `as={Link}` dari next/link. */
  as?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  /** Tooltip muncul saat sidebar collapsed ke mode icon. */
  tooltip?: React.ReactNode;
};

export const SidebarMenuButton = React.forwardRef<HTMLElement, SidebarMenuButtonProps>(
  function SidebarMenuButton(
    {
      as: Comp = "button",
      isActive = false,
      size = "md",
      variant = "default",
      tooltip,
      className,
      ...props
    },
    ref,
  ) {
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-slot="sidebar-menu-button"
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        aria-current={isActive && Comp !== "button" ? "page" : undefined}
        {...(Comp === "button" ? { type: "button" } : {})}
        className={sidebarMenuButtonClassName({ size, variant, className })}
        {...props}
      />
    );

    if (!tooltip || isMobile || state !== "collapsed") return button;

    return (
      <Tooltip delay={0}>
        <Tooltip.Trigger className="block w-full">{button}</Tooltip.Trigger>
        <Tooltip.Content placement="right" offset={8}>
          {tooltip}
        </Tooltip.Content>
      </Tooltip>
    );
  },
);

export function SidebarMenuAction({
  className,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & { showOnHover?: boolean }) {
  return (
    <button
      type="button"
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-muted outline-none",
        "transition-transform hover:bg-default hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        "peer-data-[size=sm]/menu-button:top-1 peer-data-[size=lg]/menu-button:top-3.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[open=true]:opacity-100 md:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-muted",
        "peer-data-[size=sm]/menu-button:top-1 peer-data-[size=md]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-3.5",
        "peer-data-[active=true]/menu-button:text-accent",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & { showIcon?: boolean }) {
  // Lebar deterministik (aman untuk SSR) berdasarkan useId.
  const id = React.useId();
  const width = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 40;
    return `${hash + 50}%`;
  }, [id]);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-lg px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1 rounded-md"
        style={{ "--skeleton-width": width } as React.CSSProperties}
      />
    </div>
  );
}

/*  Submenu */

export function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "ml-3.5 mt-1 flex min-w-0 flex-col gap-1 border-l border-border py-0.5 pl-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

export const SidebarMenuSubButton = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"a"> & {
    as?: React.ElementType;
    isActive?: boolean;
    size?: "sm" | "md";
  }
>(function SidebarMenuSubButton(
  { as: Comp = "a", isActive = false, size = "md", className, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref}
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-lg px-2 text-muted outline-none",
        "transition-colors hover:bg-default hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus active:bg-default/80",
        "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "data-[active=true]:bg-accent-soft data-[active=true]:text-accent-soft-foreground",
        "[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
      {...props}
    />
  );
});