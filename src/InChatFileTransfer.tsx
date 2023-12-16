/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';

type props = {
  filePath: string;
};

const InChatFileTransfer = ({filePath}: props) => {
  let fileType = '';
  let name = '';
  if (filePath !== undefined) {
    name = filePath.split('/').pop() || '';
    fileType = filePath.split('.').pop() || '';
  }
  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <Image
          source={
            fileType === 'pdf'
              ? require('./assets/chat_file.png')
              : require('./assets/unknowFile.png')
          }
          style={{height: 60, width: 60}}
        />
        <View style={{flex: 1}}>
          <Text
            style={[styles.text, {flex: 1}]}
            numberOfLines={2}
            ellipsizeMode="tail">
            {name.replaceAll('%20', ' ')}
          </Text>
          <Text style={styles.textType}>{fileType.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
};
export default InChatFileTransfer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 5,
    borderRadius: 15,
    padding: 5,
  },
  text: {
    color: 'black',
    marginTop: 10,
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 5,
    marginRight: 5,
  },
  textType: {
    color: 'black',
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  frame: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderRadius: 10,
    padding: 5,
    marginTop: -4,
  },
});
