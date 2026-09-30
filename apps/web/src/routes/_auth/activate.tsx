import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { activateAccountBodySchema } from '@UniSphere_cor/schemas'
import { useActivateAccount } from '@/hooks/queries/useAuthQueries'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/activate')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: ActivateScreen,
})

type ActivateForm = z.infer<typeof activateAccountBodySchema>

function ActivateScreen() {
  const navigate = useNavigate()
  const { mutateAsync: activate, isPending } = useActivateAccount()
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<ActivateForm>({
    resolver: zodResolver(activateAccountBodySchema),
    defaultValues: {
      email: '',
      temporaryPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ActivateForm) => {
    setErrorMsg('')
    try {
      await activate(data)
      toast.success("Account activated successfully! Please log in.")
      navigate({ to: '/login' })
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Activation failed"
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted/40 p-4 h-full">
      <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
        <h1 className="text-4xl font-display font-black tracking-tight text-primary">UniSphere</h1>
        <p className="text-sm text-foreground/70">Complete your account activation</p>
      </div>

      <Card className="w-full max-w-sm rounded-[6px] border-2 border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Activate Account</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">Enter your new password to activate.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="text-sm text-destructive font-bold bg-destructive/10 p-2 rounded-sm text-center">{errorMsg}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="rounded-[6px] border-2"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive font-semibold">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="temporaryPassword" className="font-semibold text-foreground">Temporary Password</Label>
              <PasswordInput
                id="temporaryPassword"
                className="rounded-[6px] border-2"
                {...register("temporaryPassword")}
              />
              {errors.temporaryPassword && <p className="text-sm text-destructive font-semibold">{errors.temporaryPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-semibold text-foreground">New Password</Label>
              <PasswordInput
                id="newPassword"
                className="rounded-[6px] border-2"
                {...register("newPassword")}
              />
              {errors.newPassword && <p className="text-sm text-destructive font-semibold">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-semibold text-foreground">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                className="rounded-[6px] border-2"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive font-semibold">{errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full rounded-[6px] font-bold text-[15px]" type="submit" disabled={isPending}>
              {isPending ? 'Activating...' : 'Activate Account'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

