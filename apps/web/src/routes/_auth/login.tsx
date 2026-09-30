import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginBodySchema } from '@UniSphere_cor/schemas'
import { useLogin } from '@/hooks/queries/useAuthQueries'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LoginScreen,
})

type LoginForm = z.infer<typeof loginBodySchema>

function LoginScreen() {
  const navigate = useNavigate()
  const { mutateAsync: login, isPending } = useLogin()
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('')
    try {
      await login(data)
      toast.success("Login successful")
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Invalid credentials"
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted/40 p-4 h-full">
      <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
        <h1 className="text-4xl font-display font-black tracking-tight text-primary">UniSphere</h1>
        <p className="text-sm text-foreground/70">CHARUSAT Development Club</p>
      </div>

      <Card className="w-full max-w-sm rounded-[6px] border-2 border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Login</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">Enter your email below to login.</CardDescription>
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
              {errors.email && (
                <p className="text-sm text-destructive font-semibold">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-foreground">Password</Label>
              <PasswordInput
                id="password"
                className="rounded-[6px] border-2"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive font-semibold">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full rounded-[6px] font-bold text-[15px]" type="submit" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

