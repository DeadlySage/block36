import { useState, useEffect } from 'react'

const Login = ({ login, register })=> {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const submit = ev => {
    ev.preventDefault();
    if(isRegistering) {
      register({ username, password });
    } else {
      login({ username, password });
    }
  }
  return (
    <form onSubmit={ submit }>
      <input value={ username } placeholder='username' onChange={ ev=> setUsername(ev.target.value)}/>
      <input value={ password} placeholder='password' onChange={ ev=> setPassword(ev.target.value)}/>
      <button disabled={ !username || !password }>{isRegistering ? 'Register' : 'Login'}</button>
      <p onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? 'Already have an account? Log in' : 'Need an account? Register'}
      </p>
    </form>
  );
}

function App() {
  const [auth, setAuth] = useState({});
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(()=> {
    attemptLoginWithToken();
  }, []);

  const attemptLoginWithToken = async()=> {
    const token = window.localStorage.getItem('token');
    if(token){
      const response = await fetch(`/api/auth/me`, {
        headers: {
          authorization: token
        }
      });
      const json = await response.json();
      //console.log('Stored Token:', window.localStorage.getItem('token'));
      if(response.ok){
        setAuth(json);
      }
      else {
        window.localStorage.removeItem('token');
      }
    }
  };

  useEffect(()=> {
    const fetchProducts = async()=> {
      const response = await fetch('/api/products');
      const json = await response.json();
      setProducts(json);
    };

    fetchProducts();
  }, []);

  useEffect(()=> {
    const fetchFavorites = async()=> {
      const token = window.localStorage.getItem('token');
      const response = await fetch(`/api/users/${auth.id}/favorites`, {
        headers: {
          authorization: token
        }
      });
      const json = await response.json();
      if(response.ok){
        setFavorites(json);
      }
    };
    if(auth.id){
      fetchFavorites();
    }
    else {
      setFavorites([]);
    }
  }, [auth]);

  const login = async(credentials)=> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = await response.json();
    if(response.ok){
      window.localStorage.setItem('token', json.token);
      attemptLoginWithToken();
    }
    else {
      console.log(json);
      alert("wrong credentials");
    }
  };

  const register = async(credentials) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = await response.json();
    if(response.ok){
      alert("succesfull registration");
    } else {
      alert("failed registration");
    }
  }

  const addFavorite = async(product_id)=> {
    const token = window.localStorage.getItem('token');
    const response = await fetch(`/api/users/${auth.id}/favorites`, {
      method: 'POST',
      body: JSON.stringify({ product_id }),
      headers: {
        authorization: token,
        'Content-Type': 'application/json'
      }
    });

    const json = await response.json();
    if(response.ok){
      setFavorites([...favorites, json]);
    }
    else {
      console.log(json);
    }
  }

  const removeFavorite = async(id)=> {
    const token = window.localStorage.getItem('token');
    const response = await fetch(`/api/users/${auth.id}/favorites/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: token
      }
    });

    if(response.ok){
      setFavorites(favorites.filter(favorite => favorite.id !== id));
    }
    else {
      console.log(json);
    }
  }

  const logout = ()=> {
    window.localStorage.removeItem('token');
    setAuth({});
  };

  return (
    <>
      {
        !auth.id ? <Login login={ login } register={ register }/> : <button onClick={ logout }>Logout { auth.username }</button>
      }
      <ul>
        {
          products.map( product => {
            const isFavorite = favorites.find(favorite => favorite.product_id === product.id);
            return (
              <li key={ product.id } className={ isFavorite ? 'favorite': ''}>
                { product.name }
                {
                  auth.id && isFavorite && <button onClick={()=> removeFavorite(isFavorite.id)}>-</button>
                }
                {
                  auth.id && !isFavorite && <button onClick={()=> addFavorite(product.id)}>+</button>
                }
              </li>
            );
          })
        }
      </ul>
    </>
  )
}

export default App
