const register = () => {
  console.log('Registered..')
  return () => {
    console.log('Unregistered.')
  }
}

const fn = () => {
  setTimeout(() => {
    console.log('Timeout..')
    unregister()
  }, 2000)
  const unregister = register()
}

fn()
