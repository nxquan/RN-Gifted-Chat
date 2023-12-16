/* eslint-disable react-native/no-inline-styles */
import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {Button, Text, TextInput, View} from 'react-native';

const Login = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState<string>('');

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '500',
          color: 'black',
        }}>
        Nhập email của bạn
      </Text>
      <TextInput
        placeholder="Nhập id"
        style={{
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.1)',
          borderRadius: 8,
          marginVertical: 10,
          width: '70%',
          color: 'black',
          fontSize: 15,
          backgroundColor: '#f3f3f5',
        }}
        value={email}
        onChangeText={t => setEmail(t.trim().toLowerCase())}
      />
      <Button
        title="Xác nhận"
        onPress={() => {
          navigation.navigate('Message', {email});
        }}
      />
    </View>
  );
};

export default Login;
