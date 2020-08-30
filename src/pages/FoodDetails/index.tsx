import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const foodId = routeParams.id;

      const response = await api.get<Omit<Food, 'formattedPrice'>>(
        `/foods/${foodId}`,
      );
      const foodFromAPI = response.data;

      const foodWithFormattedPrice = {
        ...foodFromAPI,
        formattedPrice: formatValue(foodFromAPI.price),
      };

      setFood(foodWithFormattedPrice);

      const extrasWithQuantity = foodFromAPI.extras.map(item => {
        return {
          ...item,
          quantity: 0,
        };
      });

      setExtras(extrasWithQuantity);

      const favoritesResponse = await api.get<
        Array<Omit<Food, 'formattedPrice'>>
      >('favorites');
      const favoritesFromAPI = favoritesResponse.data;

      if (!favoritesFromAPI) {
        setIsFavorite(false);
      } else {
        favoritesFromAPI.forEach(item => {
          if (item.id === foodFromAPI.id) {
            setIsFavorite(true);
          }
        });
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const extraSelected = extras.find(item => id === item.id);

    if (extraSelected) {
      const updatedArray = extras.map(item => {
        if (item.id === id) {
          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }
        return item;
      });

      setExtras(updatedArray);
    }
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const extraSelected = extras.find(item => id === item.id);

    if (extraSelected && extraSelected.quantity > 0) {
      const updatedArray = extras.map(item => {
        if (item.id === id) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }
        return item;
      });

      setExtras(updatedArray);
    }
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(prev => prev + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(prev => (prev > 1 ? prev - 1 : prev));
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not

    if (isFavorite) {
      api.delete(`/favorites/${food.id}`).then(() => {
        setIsFavorite(!isFavorite);
      });
    } else {
      api.post('/favorites/', food).then(() => {
        setIsFavorite(!isFavorite);
      });
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const foodCost = food.price * foodQuantity;

    let extrasCost = 0;

    extras.forEach(extra => {
      extrasCost += extra.value * extra.quantity;
    });

    return formatValue(foodCost + extrasCost);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API

    const { id, formattedPrice, ...rest } = food;

    const response = await api.post('orders', {
      product_id: food.id,
      ...rest,
      price: cartTotal,
      extras,
    });

    const orderSubmitted = response.data;

    // console.log('orderSubmitted', orderSubmitted);

    navigation.navigate('MainBottom');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
