/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useCallback, useEffect} from 'react';
import {
  Actions,
  Bubble,
  Composer,
  GiftedChat,
  IMessage,
  InputToolbar,
  Send,
} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import {useRoute} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as DocumentPicker from 'react-native-document-picker';
import InChatFileTransfer from './InChatFileTransfer';

export function Message() {
  const route = useRoute<any>();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [email, setEmail] = useState<string>('');
  const [friend, setFriend] = useState<string>('');

  const [isAttachImage, setIsAttachImage] = useState(false);
  const [isAttachFile, setIsAttachFile] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [filePath, setFilePath] = useState('');

  function onResult(query: any) {
    if (query?.size > 0) {
      const _message: any[] = [];
      query.docs.forEach((doc: any) => {
        const data: any = doc.data();
        if (
          (data.from === email && data.to === friend) ||
          (data.to === email && data.from === friend)
        ) {
          const message = data.message;
          const timestamp = message.createdAt;
          const milliseconds =
            timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
          const date = new Date(milliseconds);
          _message.push({
            ...message,
            createdAt: date,
          });
        }
      });
      _message.sort((a: any, b: any) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      setMessages(_message);
    }
  }

  function onError(error: any) {
    console.error(error);
  }

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
        mode: 'open',
        allowMultiSelection: false,
      });
      const fileUri = result[0].fileCopyUri;
      if (!fileUri) {
        console.log('File URI is undefined or null');
        return;
      }
      if (fileUri.indexOf('.png') !== -1 || fileUri.indexOf('.jpg') !== -1) {
        setImagePath(fileUri);
        setIsAttachImage(true);
      } else {
        setFilePath(fileUri);
        setIsAttachFile(true);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('DocumentPicker err => ', err);
        throw err;
      }
    }
  };

  useEffect(() => {
    setEmail(route.params.email);
  }, [route.params.email]);
  useEffect(() => {
    const getRoom = async () => {
      const room = await firestore().collection('rn_rooms').doc('room_1').get();
      const data: any = room.data();
      if (data.user1 === email) {
        setFriend(data.user2);
      } else {
        setFriend(data.user1);
      }
    };
    getRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    const subscriber = firestore()
      .collection('rn_messages')
      .onSnapshot(onResult, onError);

    // Stop listening for updates when no longer required
    return () => subscriber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend, email]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSend = useCallback(
    async (messages: any[], from: string, to: string) => {
      const data = {
        from,
        to,
        message: {
          ...messages[0],
        },
      };
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [
          {
            ...messages[0],
          },
        ]),
      );

      if (isAttachImage) {
        //Upload file to storage (Firebase) and get URL for storing in message
        const filename = imagePath.substring(imagePath.lastIndexOf('/') + 1);
        const reference = storage().ref(`images/${filename}`);
        await reference.putFile(imagePath);

        setImagePath('');
        setIsAttachImage(false);

        const url = await reference.getDownloadURL();
        data.message.image = url;
      } else if (isAttachFile) {
        //Upload file to storage (Firebase) and get URL for storing in message
        const filename = filePath.substring(filePath.lastIndexOf('/') + 1);
        const reference = storage().ref(`files/${filename}`);
        await reference.putFile(filePath);

        setFilePath('');
        setIsAttachFile(false);

        const url = await reference.getDownloadURL();
        data.message.file = url;
      }
      data.message.sent = true;

      firestore()
        .collection('rn_messages')
        .add(data)
        .then(() => {
          console.log('Messages added!');
        });
    },
    [filePath, imagePath, isAttachFile, isAttachImage],
  );

  const renderBubble = (props: any) => {
    const {currentMessage} = props;
    if (currentMessage.file) {
      const file = decodeURIComponent(currentMessage.file);
      const filename = file
        .substring(file.lastIndexOf('/') + 1, file.lastIndexOf('?alt'))
        .replaceAll('%20', ' ');
      return (
        <TouchableOpacity
          style={{
            ...styles.fileContainer,
            backgroundColor:
              props.currentMessage.user._id === email ? '#0a7cff' : '#f0f0f0',
            borderBottomLeftRadius:
              props.currentMessage.user._id === friend ? 15 : 5,
            borderBottomRightRadius:
              props.currentMessage.user._id === friend ? 5 : 15,
          }}
          onPress={() => {
            // navigation.navigate('InChatViewFile', {
            //   filePath: currentMessage.file.url,
            // })
          }}>
          <InChatFileTransfer filePath={filename} />
          <View style={{flexDirection: 'column'}}>
            <Text
              style={{
                ...styles.fileText,
                color: currentMessage.user._id === 2 ? 'white' : 'black',
              }}>
              {currentMessage.text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#0a7cff',
          },
          left: {
            backgroundColor: '#f0f0f0',
          },
        }}
        textStyle={{
          right: {
            color: 'white',
          },
          left: {
            color: 'black',
          },
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{flexDirection: 'row', alignItems: 'center'}}>
        <FontAwesome
          name="send"
          size={24}
          color="#0a7cff"
          style={{marginRight: 20}}
        />
      </Send>
    );
  };

  const renderActions = (props: any) => {
    return (
      <View style={{width: 100, flexDirection: 'row', alignItems: 'center'}}>
        <Actions
          {...props}
          containerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            margin: 0,
            width: 50,
            height: 30,
          }}
          icon={() => (
            <Ionicons name="image-outline" size={28} color="#0a7cff" />
          )}
          onPressActionButton={pickFile}
        />
        <Actions
          {...props}
          containerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            width: 50,
            height: 30,
            marginLeft: -10,
          }}
          icon={() => (
            <Ionicons name="videocam-outline" size={28} color="#0a7cff" />
          )}
          onPressActionButton={() => {
            console.log('Video');
          }}
        />
      </View>
    );
  };

  const renderComposer = (props: any) => {
    return (
      <Composer
        {...props}
        textInputStyle={{
          fontSize: 15,
          backgroundColor: '#f3f3f5',
          borderRadius: 999,
          paddingHorizontal: 12,
          marginLeft: -16,
          marginRight: 6,
        }}
      />
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 0,
          height: 54,
        }}
        renderActions={renderActions}
        renderSend={renderSend}
        renderComposer={renderComposer}
      />
    );
  };

  const scrollToBottomComponent = () => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.8)',
          borderRadius: 9999,
        }}>
        <FontAwesome
          name="angle-double-down"
          size={26}
          color="rgba(0,0,0,0.8)"
        />
      </View>
    );
  };

  const renderChatFooter = useCallback(() => {
    if (imagePath) {
      return (
        <View style={styles.chatFooter}>
          <Image source={{uri: imagePath}} style={{height: 100, width: 100}} />
          <TouchableOpacity
            onPress={() => setImagePath('')}
            style={styles.buttonFooterChatImg}>
            <Ionicons name="close" size={20} color={'gray'} />
          </TouchableOpacity>
        </View>
      );
    }
    if (filePath) {
      return (
        <View style={styles.chatFooter}>
          <InChatFileTransfer filePath={filePath} />
          <TouchableOpacity
            onPress={() => setFilePath('')}
            style={styles.buttonFooterChat}>
            <Ionicons name="close" size={20} color={'gray'} />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }, [filePath, imagePath]);

  return (
    <GiftedChat
      //Required
      onSend={messages => onSend(messages, email, friend)}
      messages={[...messages.reverse()]}
      user={{
        _id: email,
        name: email.split('@')[0],
        avatar: email.includes('user1')
          ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEagLrRN5uTxeoGcT2mj7EkKMZlviKPpvEn8Km_nunoQ&s'
          : 'https://kenh14cdn.com/thumb_w/660/2020/5/28/0-1590653959375414280410.jpg',
      }}
      //Optional
      messagesContainerStyle={{
        backgroundColor: 'white',
      }}
      renderBubble={renderBubble}
      renderInputToolbar={renderInputToolbar}
      showUserAvatar
      alwaysShowSend={true}
      showAvatarForEveryMessage={false}
      timeFormat="LTS"
      dateFormat="L"
      scrollToBottom
      scrollToBottomComponent={scrollToBottomComponent}
      renderChatFooter={renderChatFooter}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paperClip: {
    marginTop: 8,
    marginHorizontal: 5,
    transform: [{rotateY: '180deg'}],
  },
  sendButton: {marginBottom: 10, marginRight: 10},
  sendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatFooter: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: 'blue',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  fileContainer: {
    flex: 1,
    maxWidth: 300,
    marginVertical: 2,
    borderRadius: 15,
  },
  fileText: {
    marginVertical: 5,
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 10,
    marginRight: 5,
  },
  textTime: {
    fontSize: 10,
    color: 'gray',
    marginLeft: 2,
  },
  buttonFooterChat: {
    width: 35,
    height: 35,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderColor: 'black',
    right: 3,
    top: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  buttonFooterChatImg: {
    width: 30,
    height: 30,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 85,
    top: -4,
    backgroundColor: 'white',
  },
  textFooterChat: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'gray',
  },
});
