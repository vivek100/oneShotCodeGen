import { supabase } from "../supabase";
export const authProvider = {
  login: async ({ username, password }) => {
    const { user, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
    if (error) throw new Error(error.message);
    return Promise.resolve();
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    console.log("error");
    if (error) throw new Error(error.message);
    return Promise.resolve();
  },
  checkError: ({ status }) => {
    if (status === 401 || status === 403) return Promise.reject();
    return Promise.resolve();
  },
  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return Promise.reject('No valid session');
    }
    return Promise.resolve();
  },
  getPermissions: async () => {
    const { data: user } = await supabase.auth.getUser();
    return user ? Promise.resolve(user.role) : Promise.reject();
  },
};
