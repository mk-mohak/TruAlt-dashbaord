/*
  # Fix Profiles Table and User Creation

  1. Table Updates
    - Ensure Profiles table has proper structure
    - Add foreign key constraint to auth.users
    - Enable RLS with proper policies

  2. Function Updates  
    - Fix handle_new_user function to handle errors properly
    - Add proper error handling and logging

  3. Security
    - Enable RLS on Profiles table
    - Add policies for user access control
*/

-- Ensure the Profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public."Profiles" (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public."Profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON public."Profiles";
DROP POLICY IF EXISTS "Admins can view all profiles" ON public."Profiles";

-- Create RLS policies
CREATE POLICY "Users can view own profile"
  ON public."Profiles"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public."Profiles"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public."Profiles"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Profiles"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create or replace the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert new profile with default operator role
  INSERT INTO public."Profiles" (id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    'operator',
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (in a real app, you might want to use a logging table)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Re-raise the exception to prevent user creation if profile creation fails
    RAISE;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public."Profiles"
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'operator');
END;
$$;