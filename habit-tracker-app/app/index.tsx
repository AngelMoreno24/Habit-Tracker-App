import { View, Text } from 'react-native'
import React, { useState} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth } from '../FirebaseConfig'
import { createUserWithEmailAndPassword,signInWithEmailAndPassword } from 'firebase/auth'

const index = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const signIn = async () => {
        try {
            const user = await signInWithEmailAndPassword(auth, email, password)
            if()
        } catch (error){
            console.log(error)
            alert(`Sign in Ffailed: ${error}`)
        }

    }

  return (
    <SafeAreaView>
      <Text>index</Text>
    </SafeAreaView>
  )
}

export default index