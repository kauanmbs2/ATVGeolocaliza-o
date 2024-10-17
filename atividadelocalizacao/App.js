import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, Button, TextInput, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const questionsData = {
  "Brasil": [
    { question: "Qual a capital do Brasil?", answer: "Brasília" },
    { question: "Quantos estados o Brasil tem?", answer: "26" },
    { question: "Qual é a moeda do Brasil?", answer: "Real" }
  ],
  "EUA": [
    { question: "Qual a capital dos EUA?", answer: "Washington, D.C." },
    { question: "Quantos estados existem?", answer: "50" },
    { question: "Qual é a moeda dos EUA?", answer: "Dólar" }
  ],
  "Itália": [
    { question: "Qual é a capital da Itália?", answer: "Roma" },
    { question: "Qual é a língua oficial da Itália?", answer: "Italiano" },
    { question: "Em que ano a Itália foi unificada?", answer: "1861" }
  ],
};

function HomeScreen({ navigation }) {
  const [latitude, setLatitude] = useState(0.0);
  const [longitude, setLongitude] = useState(0.0);
  const [country, setCountry] = useState(null);

  useEffect(() => {
    const fetchLocationAndCountry = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão negada para acessar a localização.");
        return;
      }

      const location = await Location.getCurrentPositionAsync();
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);

      const country = await fetchCountry(lat, lon);
      console.log("País detectado:", country);
      setCountry(country);
    };

    const fetchCountry = async (lat, lon) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const response = await axios.get(url);
      const address = response.data.address;
      return address?.country || null;
    };

    fetchLocationAndCountry();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela Inicial</Text>
      <Text>Longitude: {longitude === 0 ? "..." : longitude}</Text>
      <Text>Latitude: {latitude === 0 ? "..." : latitude}</Text>
      <Text>País: {country === null ? "..." : country}</Text>
      {country && questionsData[country] ? (
        <Button
          title="Ver Perguntas"
          onPress={() => {
            console.log("Navegando para perguntas com país:", country); 
            navigation.navigate('Questions', { country });
          }}
        />
      ) : (
        <Text>Não há perguntas disponíveis para este país.</Text>
      )}
    </View>
  );
}

function QuestionsScreen({ route, navigation }) {
  const { country } = route.params;
  console.log("País na tela de perguntas:", country);
  const questions = questionsData[country] || [];
  const [answers, setAnswers] = useState(new Array(questions.length).fill(''));

  const handleAnswerChange = (index, text) => {
    const newAnswers = [...answers];
    newAnswers[index] = text;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const correctAnswers = answers.filter((answer, index) => answer.trim().toLowerCase() === questions[index].answer.toLowerCase()).length;
    navigation.navigate('Results', { correctAnswers, totalQuestions: questions.length });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Perguntas para {country}</Text>
      {questions.length > 0 ? (
        questions.map((item, index) => (
          <View key={index} style={styles.questionContainer}>
            <Text>{index + 1}. {item.question}</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua resposta"
              value={answers[index]}
              onChangeText={(text) => handleAnswerChange(index, text)}
            />
          </View>
        ))
      ) : (
        <Text>Não há perguntas disponíveis para {country}.</Text>
      )}
      {questions.length > 0 && (
        <Button title="Enviar Respostas" onPress={handleSubmit} />
      )}
    </ScrollView>
  );
}

function ResultsScreen({ route }) {
  const { correctAnswers, totalQuestions } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resultados</Text>
      <Text style={styles.resultText}>Você acertou {correctAnswers} de {totalQuestions} perguntas.</Text>
      <Text style={styles.resultText}>
        {correctAnswers / totalQuestions >= 0.7 ? "Parabéns! Você se saiu bem!" : "Tente novamente!"}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Questions" component={QuestionsScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#f0f8ff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  questionContainer: {
    marginVertical: 10,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#007bff',
    padding: 10,
    width: '100%',
    marginTop: 5,
    borderRadius: 5,
  },
  resultText: {
    fontSize: 18,
    marginTop: 10,
  },
});
