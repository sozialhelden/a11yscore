import { faker } from "@faker-js/faker";

export function randomIdAndName<Id = string>() {
  const name = faker.lorem
    .words(3)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    id: name.split(" ").join("-").toLowerCase() as Id,
    name,
  };
}

export function randomWeight() {
  return faker.number.float({ min: 0.1, max: 0.5, fractionDigits: 1 });
}
