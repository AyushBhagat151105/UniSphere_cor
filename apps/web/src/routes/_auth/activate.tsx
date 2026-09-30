import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { activateAccountBodySchema } from '@UniSphere_cor/schemas'
import { useActivateAccount } from '@/hooks/queries/useAuthQueries'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/activate')({
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
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Activate Account</CardTitle>
          <CardDescription>Enter your new password to activate.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="text-sm text-red-500 font-medium">{errorMsg}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="temporaryPassword">Temporary Password</Label>
              <Input
                id="temporaryPassword"
                type="password"
                {...register("temporaryPassword")}
              />
              {errors.temporaryPassword && <p className="text-sm text-red-500">{errors.temporaryPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...register("newPassword")}
              />
              {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Activating...' : 'Activate Account'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
