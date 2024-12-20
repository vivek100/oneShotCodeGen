import React from "react";
import { Admin, Resource, CustomRoutes, Authenticated } from "react-admin";
import { Route } from "react-router-dom";
import { dataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import Dashboard from "./pages/Dashboard";
import CustomLayout from "./layout";


import ExpensesList from "./pages/ExpensesList";
import ExpensesView from "./pages/ExpensesView";
import ExpensesEdit from "./pages/ExpensesEdit";
import ExpensesCreate from "./pages/ExpensesCreate";

import CategoriesList from "./pages/CategoriesList";
import CategoriesView from "./pages/CategoriesView";
import CategoriesEdit from "./pages/CategoriesEdit";
import CategoriesCreate from "./pages/CategoriesCreate";


const App = () => (
  <Admin 
    dashboard={Dashboard}
    dataProvider={dataProvider}
    authProvider={authProvider}
    layout={CustomLayout}
  >
    
    <Resource
      name="expenses"
      list={ ExpensesList }
      show={ ExpensesView }
      edit={ ExpensesEdit }
      create={ ExpensesCreate }
    />
    
    <Resource
      name="categories"
      list={ CategoriesList }
      show={ CategoriesView }
      edit={ CategoriesEdit }
      create={ CategoriesCreate }
    />
    </Admin>
);

export default App;