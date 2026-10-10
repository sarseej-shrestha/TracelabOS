import unittest

from verify import forward

PARAMETERS = {"prior": 0.2, "learn": 0.1, "guess": 0.25, "slip": 0.1}


class ForwardTests(unittest.TestCase):
    def test_prior(self):
        self.assertEqual(forward([], PARAMETERS), 0.2)

    def test_correct_and_incorrect(self):
        self.assertAlmostEqual(forward([True], PARAMETERS), 10 / 19)
        self.assertAlmostEqual(forward([False], PARAMETERS), 4 / 31)

    def test_order_matters(self):
        self.assertNotEqual(
            forward([True, False], PARAMETERS), forward([False, True], PARAMETERS)
        )

    def test_learning_free_model(self):
        parameters = dict(PARAMETERS, learn=0)
        # Likelihood ratios multiply commutatively without a learning transition.
        self.assertEqual(
            forward([True, False], parameters), forward([False, True], parameters)
        )


if __name__ == "__main__":
    unittest.main()
