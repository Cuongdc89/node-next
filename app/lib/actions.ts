'use server';
import { z } from 'zod'
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status:z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
    note: z.string().max(500, { message: 'Note must be less than 500 characters long.' }),
})

const FormCustomerSchema = z.object({
    name: z.string().min(6, { message: 'Name must be at least 6 characters long.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    phone: z.string().min(10, { message: 'Phone number must be at least 10 characters long.' }),
    address: z.string(),
    date: z.string()
  })

const CreateInvoice = FormSchema.omit({id:true, date:true});
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
const CreateCustommer = FormCustomerSchema.omit({date:true});
export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
      note?: string[];
    };
    message?: string | null;
  };

export type CreateCustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    address?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
        note: formData.get('note'),
    });

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customerId, amount, status, note } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try {
        await sql `
        INSERT into invoices (customer_id, amount, status, date, note)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${note})`;
    } catch(error) {
        console.log(error)
        return {
            message: 'Database Error: Failed to Create Invoice.',
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
        note: formData.get('note'),
      });
     
      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to Update Invoice.',
        };
      }
    
      const { customerId, amount, status, note } = validatedFields.data;
      const amountInCents = amount * 100;
    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}, note = ${note}
        WHERE id = ${id}
    `;
    } catch(error) {
        console.log(error)
        return {
            message : 'Database Error: Failed to Update Invoice.',
        }
    }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id:string) {
   try { 
        await sql`
        DELETE FROM invoices
        WHERE id = ${id}
    `;
   } catch(error) {
    console.log(error)

   }
   revalidatePath('/dashboard/invoices');
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }

export async function createCustommer(prevState: CreateCustomerState, formData: FormData) {
  const validatedFields = CreateCustommer.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
  });

  console.log(validatedFields);

  if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
  }

  const { name, email, phone, address} = validatedFields.data;
  try {
      await sql `
      INSERT into customers (name, email, image_url, phone, address)
      VALUES (${name}, ${email}, 'https://randomuser.me/api/portraits', ${phone}, ${address})`;
  } catch(error) {
      console.log(error)
      return {
          message: 'Database Error: Failed to Create Invoice.',
      }
  }
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}
