const fmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export const formatDate = (iso: string) => fmt.format(new Date(iso))
