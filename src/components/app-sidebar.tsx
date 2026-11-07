import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { navGroups } from '#/components/nav'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '#/components/ui/sidebar'

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

type Props = {
  role: 'superadmin' | 'member'
  name: string
  username: string
  onSignOut: () => void
  signingOut: boolean
}

export function AppSidebar({
  role,
  name,
  username,
  onSignOut,
  signingOut,
}: Props) {
  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.superadminOnly || role === 'superadmin'),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-9 items-center gap-2.5 px-2 font-semibold">
          <span
            aria-hidden
            className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
          />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            levireg / console
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ title, to, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <Link to={to} activeOptions={{ exact: true }}>
                      {({ isActive }) => (
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={title}
                          render={<span />}
                        >
                          <Icon />
                          <span>{title}</span>
                        </SidebarMenuButton>
                      )}
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 p-1">
          <Avatar className="rounded-lg">
            <AvatarFallback className="rounded-lg">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              @{username}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            disabled={signingOut}
            onClick={onSignOut}
            className="group-data-[collapsible=icon]:hidden"
          >
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
