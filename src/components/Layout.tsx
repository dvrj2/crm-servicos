import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader as AppSidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar'
import {
  Bell,
  LayoutDashboard,
  Search,
  Users,
  FileBarChart,
  LogOut,
  CalendarDays,
  DollarSign,
  LineChart,
  Activity,
  Briefcase,
  Terminal,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import { useSandbox } from '@/hooks/use-sandbox'

export default function Layout() {
  const { user, signOut } = useAuth()
  const { isSandbox, toggleSandbox } = useSandbox()
  const location = useLocation()

  const getInitials = (name: string) => (name ? name.substring(0, 2).toUpperCase() : 'U')

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        {isSandbox && (
          <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-center text-sm font-bold flex items-center justify-center gap-2 z-50 shadow-sm shrink-0">
            <AlertTriangle className="w-4 h-4" />
            MODO SANDBOX ATIVO - Nenhuma ação externa será executada
          </div>
        )}
        <div className="flex flex-1 w-full overflow-hidden">
          <Sidebar className="border-r shadow-sm">
            <AppSidebarHeader className="py-4 px-6 border-b">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Gestão Operacional
              </h1>
            </AppSidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/'}
                        tooltip="Painel Kanban"
                      >
                        <Link to="/">
                          <LayoutDashboard />
                          <span>Painel Kanban</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/schedule'}
                        tooltip="Agenda"
                      >
                        <Link to="/schedule">
                          <CalendarDays />
                          <span>Agenda</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/empresarios'}
                        tooltip="Empresários"
                      >
                        <Link to="/empresarios">
                          <Briefcase />
                          <span>Empresários</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/users'}
                        tooltip="Usuários"
                      >
                        <Link to="/users">
                          <UserPlus />
                          <span>Usuários</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/technicians'}
                        tooltip="Técnicos"
                      >
                        <Link to="/technicians">
                          <Users />
                          <span>Técnicos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/finance'}
                        tooltip="Financeiro"
                      >
                        <Link to="/finance">
                          <DollarSign />
                          <span>Financeiro</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/reports'}
                        tooltip="Relatórios"
                      >
                        <Link to="/reports">
                          <FileBarChart />
                          <span>Relatórios</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/indicators'}
                        tooltip="Indicadores Estratégicos"
                      >
                        <Link to="/indicators">
                          <LineChart />
                          <span>Indicadores</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/simulator'}
                        tooltip="Simulador"
                      >
                        <Link to="/simulator">
                          <Activity />
                          <span>Simulador</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === '/settings/sandbox'}
                        tooltip="Configurações – Sandbox"
                      >
                        <Link to="/settings/sandbox">
                          <Terminal />
                          <span>Sandbox</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="flex flex-col flex-1 bg-slate-50 overflow-hidden min-w-0">
            <header className="h-16 shrink-0 border-b bg-white flex items-center justify-between px-6 shadow-sm z-10">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-96 max-w-md hidden md:flex">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar OS por cliente ou ID..."
                    className="pl-9 bg-slate-50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-slate-600" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2 border-b mb-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user?.name && <p className="font-medium">{user.name}</p>}
                        {user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="px-2 py-2 mb-2 bg-amber-50 rounded-md border border-amber-100 mx-2 flex items-center justify-between">
                      <Label
                        htmlFor="sandbox-mode"
                        className="text-xs font-semibold text-amber-900 cursor-pointer flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> Sandbox
                      </Label>
                      <Switch
                        id="sandbox-mode"
                        checked={isSandbox}
                        onCheckedChange={toggleSandbox}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>
                    <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 overflow-hidden p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
