import unittest
from unittest.mock import patch
from calculator.utils import parSC, ERROR_MESSAGES

class ParSCTests(unittest.TestCase):

    def test_input_set_not_a_set(self):
        """Test that an error is raised if input set is not a set."""
        with self.assertRaises(TypeError) as context:
            parSC([1, 2, 3])
            self.assertEqual(str(context.exception), ERROR_MESSAGES.invalid_set)