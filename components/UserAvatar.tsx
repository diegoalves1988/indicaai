import { Image } from 'expo-image'; // Usando expo-image para melhor performance e cache
import React from 'react';
import { Text, View } from 'react-native';

interface UserAvatarProps {
  photoURL?: string | null;
  name?: string;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ photoURL, name, size = 50 }) => {
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const names = fullName.split(' ');
    const firstInitial = names[0] ? names[0][0] : '';
    const lastInitial = names.length > 1 && names[names.length - 1] ? names[names.length - 1][0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || '?';
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#ccc', // Cor de fundo para o avatar de iniciais
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    overflow: 'hidden' as 'hidden', // Garante que a imagem não ultrapasse as bordas arredondadas
  };

  const initialsStyle = {
    fontSize: size / 2.5,
    color: '#fff', // Cor do texto das iniciais
    fontWeight: 'bold' as 'bold',
  };

  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={avatarStyle}
        placeholder={require('../assets/images/avatar_link.jpg')} // Placeholder local enquanto carrega ou se falhar
        transition={300} // Efeito suave de transição
      />
    );
  }

  return (
    <View style={avatarStyle}>
      <Text style={initialsStyle}>{getInitials(name)}</Text>
    </View>
  );
};

export default UserAvatar;

